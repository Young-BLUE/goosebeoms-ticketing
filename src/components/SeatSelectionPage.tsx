import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, MapPin, Ticket, X, Loader2 } from 'lucide-react';
import { getZones, getSeats } from '../api/schedules';
import { getMyCoupons } from '../api/coupons';
import { holdBooking } from '../api/bookings';
import type { ZoneResponse, SeatResponse, UserCouponResponse } from '../api/types';

interface SeatSelectionPageProps {
  scheduleId: number;
  queueToken: string | null;
  onBack: () => void;
  onComplete: (bookingId: number) => void;
}

// 좌석 격자 최소 크기 — 백엔드 데이터가 부족할 때 시드로 채워 공연장 느낌을 살린다.
// 시드 좌석은 음수 ID로 부여되며 holdBooking 호출 시 백엔드가 거부할 수 있다.
const MIN_ROWS = 10;
const MIN_COLS = 18;

// 좌석 등급 — zone.name의 명시적 표기 우선, 없으면 가격 ranking으로 결정.
type ZoneTier = 'vip' | 'r' | 's' | 'a';
const TIER_ORDER: ZoneTier[] = ['vip', 'r', 's', 'a'];

function getZoneTier(zone: ZoneResponse, allZones: ZoneResponse[]): ZoneTier {
  const n = zone.name;
  if (/VIP/i.test(n)) return 'vip';
  if (/(^|\s)R(석|구역|존)?($|\s)/.test(n)) return 'r';
  if (/(^|\s)S(석|구역|존)?($|\s)/.test(n)) return 's';
  if (/(^|\s)A(석|구역|존)?($|\s)/.test(n)) return 'a';
  const prices = Array.from(new Set(allZones.map((z) => z.price))).sort((a, b) => b - a);
  if (prices.length <= 1) return 'r';
  const rank = prices.indexOf(zone.price);
  if (rank === 0) return 'vip';
  if (rank === 1) return 'r';
  if (rank === 2) return 's';
  return 'a';
}

// 등급별 시각 스타일 — 블랙앤화이트 컨셉 유지하면서 VIP만 골드 액센트로 차별화.
const TIER_STYLES: Record<ZoneTier, { seat: string; dot: string; badge: string; label: string }> = {
  vip: {
    seat: 'bg-amber-300 text-amber-950 hover:bg-amber-400',
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-900',
    label: 'VIP석',
  },
  r: {
    seat: 'bg-neutral-700 text-white hover:bg-neutral-800',
    dot: 'bg-neutral-700',
    badge: 'bg-neutral-200 text-neutral-800',
    label: 'R석',
  },
  s: {
    seat: 'bg-neutral-400 text-white hover:bg-neutral-500',
    dot: 'bg-neutral-400',
    badge: 'bg-neutral-100 text-neutral-700',
    label: 'S석',
  },
  a: {
    seat: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300',
    dot: 'bg-neutral-300',
    badge: 'bg-neutral-100 text-neutral-600',
    label: 'A석',
  },
};

// 시드 좌석에 적용되는 "이미 예매됨" 분포 프리셋.
// 페이지 진입할 때마다 무작위로 하나가 선택되어 좌석 점유 양상이 달라진다.
type PrebookedPattern = (
  rowIdx: number,
  colIdx: number,
  rowCount: number,
  colCount: number,
  rand: () => number,
) => boolean;

const PREBOOKED_PATTERNS: PrebookedPattern[] = [
  (r, c, rC, cC, rnd) => {
    const midRow = r >= rC * 0.2 && r <= rC * 0.65;
    const midCol = c >= cC * 0.25 && c <= cC * 0.75;
    return midRow && midCol && rnd() < 0.55;
  },
  (_r, _c, _rC, _cC, rnd) => rnd() < 0.22,
  (r, _c, rC, _cC, rnd) => rnd() < (r / Math.max(rC - 1, 1)) * 0.7 + 0.05,
  (r, _c, rC, _cC, rnd) => rnd() < (1 - r / Math.max(rC - 1, 1)) * 0.7 + 0.05,
  (r, _c, _rC, _cC, rnd) => r % 2 === 0 && rnd() < 0.65,
  (_r, c, _rC, cC, rnd) => {
    const center = (cC - 1) / 2;
    const dist = center === 0 ? 0 : Math.abs(c - center) / center;
    return rnd() < (1 - dist) * 0.55;
  },
];

// 시드 기반 PRNG — 같은 seed 면 같은 분포가 재현되어 zone 전환에도 점유가 안정적이다.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 한 floor의 모든 zone을 하나의 격자로 통합. 격자 크기는 zone 중 max 값(최소 MIN_*).
function getFloorGridSize(floorZones: ZoneResponse[]): { rowCount: number; columnCount: number } {
  if (floorZones.length === 0) return { rowCount: MIN_ROWS, columnCount: MIN_COLS };
  return {
    rowCount: Math.max(MIN_ROWS, ...floorZones.map((z) => z.rowCount || 0)),
    columnCount: Math.max(MIN_COLS, ...floorZones.map((z) => z.columnCount || 0)),
  };
}

// 좌석 "선호도 점수" — 낮을수록 좋은 자리 (앞쪽 중앙=0, 뒤쪽 가장자리=1).
// 행 가중치 0.55, 중앙 거리 가중치 0.45 — 앞자리 우대를 살짝 강하게.
function getSeatScore(
  rowIdx: number,
  colIdx: number,
  totalRows: number,
  totalCols: number,
): number {
  const center = (totalCols - 1) / 2;
  const distFromCenter = center === 0 ? 0 : Math.abs(colIdx - center) / center;
  const rowRatio = totalRows <= 1 ? 0 : rowIdx / (totalRows - 1);
  return rowRatio * 0.55 + distFromCenter * 0.45;
}

// 1층 전체 좌석을 위치 점수 순(좋은 자리부터) 정렬 → zone의 availableSeats 비율로 등급 영역 할당.
// 결과: "rowIdx-colIdx" key → ZoneTier. 좋은 자리=VIP, 가장자리/뒷줄=R/S/A.
function assignSeatTiers(
  rowCount: number,
  columnCount: number,
  floorZones: ZoneResponse[],
): Map<string, ZoneTier> {
  const map = new Map<string, ZoneTier>();
  if (floorZones.length === 0) return map;
  const sortedZones = [...floorZones].sort((a, b) => b.price - a.price);
  const totalSeats = rowCount * columnCount;
  const totalAvailable = sortedZones.reduce(
    (sum, z) => sum + Math.max(z.availableSeats || 0, 0),
    0,
  );
  // zone별 격자 점유 비율 — availableSeats 비율로 분배(데이터 없으면 균등)
  const buckets = sortedZones.map((z) => ({
    tier: getZoneTier(z, sortedZones),
    size:
      totalAvailable > 0
        ? Math.max(1, Math.round((Math.max(z.availableSeats || 0, 0) / totalAvailable) * totalSeats))
        : Math.floor(totalSeats / sortedZones.length),
  }));
  // 좌표 + 점수 → 점수 오름차순(좋은 자리부터)
  const scored: { row: number; col: number; score: number }[] = [];
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < columnCount; c++) {
      scored.push({ row: r, col: c, score: getSeatScore(r, c, rowCount, columnCount) });
    }
  }
  scored.sort((a, b) => a.score - b.score);
  // 좋은 자리부터 등급 영역 순서대로 채움
  let cursor = 0;
  for (const b of buckets) {
    for (let i = 0; i < b.size && cursor < scored.length; i++) {
      const s = scored[cursor++];
      map.set(`${s.row}-${s.col}`, b.tier);
    }
  }
  // 남은 좌석은 가장 낮은 등급으로
  const fallback = buckets[buckets.length - 1]?.tier ?? 'a';
  while (cursor < scored.length) {
    const s = scored[cursor++];
    map.set(`${s.row}-${s.col}`, fallback);
  }
  return map;
}

// 1층 통합 격자 생성. floor의 모든 zone을 합친 좌석 격자 + 백엔드 좌석 덮어쓰기.
function buildFloorSeatGrid(
  floorZones: ZoneResponse[],
  backendSeats: SeatResponse[],
  rowCount: number,
  columnCount: number,
  prebookedKeys: Set<string>,
): SeatResponse[] {
  const aBase = 'A'.charCodeAt(0);
  const map = new Map<string, SeatResponse>();
  let synthId = -1_000_000 - (floorZones[0]?.id ?? 0) * 10_000;
  for (let r = 0; r < rowCount; r++) {
    const rowLabel = String.fromCharCode(aBase + r);
    for (let n = 1; n <= columnCount; n++) {
      const key = `${rowLabel}-${n}`;
      map.set(key, {
        id: synthId--,
        rowLabel,
        number: n,
        status: prebookedKeys.has(key) ? 'BOOKED' : 'AVAILABLE',
        zoneId: floorZones[0]?.id,
      });
    }
  }
  // 백엔드 좌석이 있으면 시드보다 우선
  for (const s of backendSeats) {
    map.set(`${s.rowLabel}-${s.number}`, s);
  }
  return Array.from(map.values());
}

// 백엔드가 floor 정보를 주지 않으므로 zone.name 패턴 추론 → 실패 시 zones 절반씩 분배.
function groupZonesByFloor(zones: ZoneResponse[]): { label: string; zones: ZoneResponse[] }[] {
  if (zones.length === 0) return [];
  const explicit = new Map<string, ZoneResponse[]>();
  let allMatched = true;
  for (const z of zones) {
    const m = z.name.match(/([B]?\d+)\s*층|\b([B]?[12])F\b/i);
    const key = m ? (m[1] ?? m[2]).toUpperCase() : null;
    if (!key) {
      allMatched = false;
      break;
    }
    const list = explicit.get(key) ?? [];
    list.push(z);
    explicit.set(key, list);
  }
  if (allMatched && explicit.size > 0) {
    return Array.from(explicit.entries()).map(([label, zs]) => ({
      label: /^\d+$/.test(label) ? `${label}층` : label,
      zones: zs,
    }));
  }
  if (zones.length <= 2) {
    return [{ label: '1층', zones }];
  }
  const mid = Math.ceil(zones.length / 2);
  return [
    { label: '1층', zones: zones.slice(0, mid) },
    { label: '2층', zones: zones.slice(mid) },
  ];
}

export function SeatSelectionPage({
  scheduleId,
  queueToken,
  onBack,
  onComplete,
}: SeatSelectionPageProps) {
  const [zones, setZones] = useState<ZoneResponse[]>([]);
  const [seats, setSeats] = useState<SeatResponse[]>([]);
  const [coupons, setCoupons] = useState<UserCouponResponse[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<number | undefined>(undefined);
  const [activeFloorIdx, setActiveFloorIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getZones(scheduleId), getSeats(scheduleId), getMyCoupons().catch(() => [])])
      .then(([z, s, c]) => {
        setZones(z);
        setSeats(s);
        setCoupons(c.filter((c) => c.status === 'ISSUED'));
      })
      .catch(() => setError('좌석 정보를 불러오는데 실패했습니다'))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  const floors = useMemo(() => groupZonesByFloor(zones), [zones]);
  const activeFloor = floors[activeFloorIdx] ?? floors[0];
  const floorZones = useMemo(() => activeFloor?.zones ?? [], [activeFloor]);

  // floor 전환 시 선택 좌석 초기화
  useEffect(() => {
    setSelectedSeatIds([]);
  }, [activeFloorIdx]);

  // 첫 번째가 아닌 floor는 "상층(발코니)"으로 취급 — 좌석 크기/모양 차별화
  const isUpperFloor = activeFloorIdx > 0;

  // 1층 통합 격자 크기 + 위치 기반 등급 배치
  const { rowCount: floorRows, columnCount: floorCols } = useMemo(
    () => getFloorGridSize(floorZones),
    [floorZones],
  );
  const seatTierMap = useMemo(
    () => assignSeatTiers(floorRows, floorCols, floorZones),
    [floorRows, floorCols, floorZones],
  );
  // 등급별 대표 zone (가격 표시/계산용) — 같은 등급에 여러 zone 있으면 가격 가장 높은 zone
  const tierZoneMap = useMemo(() => {
    const m: Partial<Record<ZoneTier, ZoneResponse>> = {};
    const sortedZones = [...floorZones].sort((a, b) => b.price - a.price);
    for (const z of sortedZones) {
      const t = getZoneTier(z, sortedZones);
      if (!(t in m)) m[t] = z;
    }
    return m;
  }, [floorZones]);

  // 진입할 때마다 새 seed/패턴 — scheduleId가 바뀌면 다시 결정
  const prebookSeed = useMemo(() => Math.floor(Math.random() * 1_000_000) + 1, [scheduleId]);
  const prebookedPattern = useMemo(
    () => PREBOOKED_PATTERNS[Math.floor(Math.random() * PREBOOKED_PATTERNS.length)],
    [scheduleId],
  );

  // 1층 격자의 백엔드 좌석들 + 시드 좌석(랜덤 BOOKED 적용)
  const floorSeats = useMemo(() => {
    if (floorZones.length === 0) return [];
    // floor 라벨을 seed에 섞어 floor별로 다른 점유 분포
    const floorKey = activeFloor?.label.charCodeAt(0) ?? 0;
    const rand = mulberry32(prebookSeed + floorKey * 7919);
    const prebookedKeys = new Set<string>();
    for (let r = 0; r < floorRows; r++) {
      for (let c = 0; c < floorCols; c++) {
        if (prebookedPattern(r, c, floorRows, floorCols, rand)) {
          prebookedKeys.add(`${String.fromCharCode(65 + r)}-${c + 1}`);
        }
      }
    }
    const floorZoneIds = new Set(floorZones.map((z) => z.id));
    const backendSeats = seats.filter((s) => s.zoneId != null && floorZoneIds.has(s.zoneId));
    return buildFloorSeatGrid(floorZones, backendSeats, floorRows, floorCols, prebookedKeys);
  }, [floorZones, floorRows, floorCols, seats, prebookSeed, prebookedPattern, activeFloor]);

  // 좌석 → 등급/가격 — 좌석 위치(rowLabel, number)로 seatTierMap에 조회
  const getSeatTier = (seat: SeatResponse): ZoneTier => {
    const rowIdx = seat.rowLabel.charCodeAt(0) - 65;
    const colIdx = seat.number - 1;
    return seatTierMap.get(`${rowIdx}-${colIdx}`) ?? 'a';
  };
  const getSeatPrice = (seat: SeatResponse): number => {
    const tier = getSeatTier(seat);
    return tierZoneMap[tier]?.price ?? 0;
  };

  const selectedSeats = useMemo(
    () => floorSeats.filter((s) => selectedSeatIds.includes(s.id)),
    [floorSeats, selectedSeatIds],
  );

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0);

  const selectedCoupon = coupons.find((c) => c.id === selectedCouponId);
  const discountAmount = selectedCoupon
    ? selectedCoupon.discountType === 'FIXED'
      ? selectedCoupon.discountValue
      : Math.floor((totalPrice * selectedCoupon.discountValue) / 100)
    : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const toggleSeat = (seat: SeatResponse) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelectedSeatIds((prev) =>
      prev.includes(seat.id) ? prev.filter((id) => id !== seat.id) : [...prev, seat.id],
    );
  };

  const handleConfirm = async () => {
    if (selectedSeatIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const booking = await holdBooking(
        { scheduleId, seatIds: selectedSeatIds, userCouponId: selectedCouponId },
        queueToken,
      );
      onComplete(booking.id);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '예매 홀드에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  if (error && seats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={onBack} className="px-6 py-3 bg-brand text-white rounded-lg">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const groupedByRow = floorSeats.reduce<Record<string, SeatResponse[]>>((acc, seat) => {
    if (!acc[seat.rowLabel]) acc[seat.rowLabel] = [];
    acc[seat.rowLabel].push(seat);
    return acc;
  }, {});
  const rows = Object.keys(groupedByRow).sort();
  const visibleTiers = TIER_ORDER.filter((t) => tierZoneMap[t]);
  const seatShape = isUpperFloor ? 'rounded-md' : 'rounded-t-md rounded-b';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-gray-900">좌석 선택</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* 좌석 선택 영역 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 lg:p-12">
              {/* 층(floor) 탭 */}
              {floors.length > 1 && (
                <div className="mb-4 sm:mb-5">
                  <div className="inline-flex rounded-xl bg-gray-100 p-1">
                    {floors.map((f, idx) => (
                      <button
                        key={f.label}
                        onClick={() => setActiveFloorIdx(idx)}
                        className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-sm transition-colors ${
                          activeFloorIdx === idx
                            ? 'bg-white text-brand shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 좌석 등급 안내 — zone 탭 자리, 정보성 카드로 변환.
                  실제 공연장처럼 같은 공간에서 위치에 따라 등급이 자동 결정됨을 안내. */}
              <div className="mb-6">
                <h2 className="text-gray-900 mb-3">
                  {floors.length > 1 ? `${activeFloor?.label ?? ''} 좌석 등급 안내` : '좌석 등급 안내'}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {visibleTiers.map((tier) => {
                    const style = TIER_STYLES[tier];
                    const z = tierZoneMap[tier];
                    if (!z) return null;
                    return (
                      <div
                        key={tier}
                        className="px-3 py-1.5 rounded-lg text-sm bg-gray-50 border border-gray-200 inline-flex items-center gap-2"
                      >
                        <span
                          aria-hidden
                          className={`inline-block w-3 h-3 rounded-full ${style.dot} ring-1 ring-black/10`}
                        />
                        <span className="text-gray-900">{style.label}</span>
                        <span className="text-xs text-gray-500">
                          {z.price.toLocaleString()}원
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  좌석 위치(중앙·앞쪽일수록 상위 등급)에 따라 등급이 자동으로 결정됩니다.
                </p>
              </div>

              {/* STAGE / BALCONY 라벨 */}
              {!isUpperFloor ? (
                <div className="relative mb-8 sm:mb-10">
                  <div className="absolute inset-x-8 sm:inset-x-16 -bottom-3 h-6 bg-brand/20 blur-2xl" />
                  <div
                    className="relative mx-auto bg-gradient-to-b from-neutral-700 to-neutral-900 text-white text-center py-3 sm:py-4 shadow-xl"
                    style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)', width: '78%' }}
                  >
                    <span className="tracking-[0.4em] text-sm sm:text-base">STAGE</span>
                  </div>
                </div>
              ) : (
                <div className="relative mb-6 sm:mb-8">
                  <div className="mx-auto h-1.5 w-3/4 rounded-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] sm:text-xs tracking-[0.35em] text-gray-500 border border-dashed border-gray-300 rounded-full bg-white">
                      BALCONY · {activeFloor?.label ?? '2층'}
                    </span>
                  </div>
                </div>
              )}

              {/* 좌석 상태 범례 — 등급별 색은 위 안내 카드에서, 여긴 선택/완료 상태만 */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 bg-brand ${seatShape} shadow-sm`}
                  />
                  <span className="text-xs sm:text-sm text-gray-600">선택됨</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 ${seatShape} shadow-sm opacity-60`}
                  />
                  <span className="text-xs sm:text-sm text-gray-600">예매완료</span>
                </div>
              </div>

              {/* 좌석 배치도 */}
              {rows.length === 0 ? (
                <p className="text-center text-gray-500 py-8">좌석 정보가 없습니다</p>
              ) : (
                <div className="overflow-x-auto pb-3 px-2 sm:px-6 lg:px-8">
                  {/*
                    w-max: wrapper가 콘텐츠 너비만큼 확장 → 좁은 viewport에서 좌측 좌석이 잘리지 않고 스크롤로 도달 가능.
                    mx-auto: wrapper가 컨테이너보다 좁으면 가운데 정렬, 더 넓으면 좌측 정렬 + 가로 스크롤.
                  */}
                  <div
                    className="w-max mx-auto"
                    style={{ perspective: isUpperFloor ? '1200px' : '1600px' }}
                  >
                    <div
                      className="space-y-1.5 sm:space-y-2"
                      style={{
                        transform: `rotateX(${isUpperFloor ? 18 : 10}deg)`,
                        transformOrigin: 'top center',
                      }}
                    >
                      {rows.map((row) => {
                        const seatsInRow = groupedByRow[row].sort((a, b) => a.number - b.number);
                        const half = Math.ceil(seatsInRow.length / 2);
                        const leftHalf = seatsInRow.slice(0, half);
                        const rightHalf = seatsInRow.slice(half);
                        const sizeCls = isUpperFloor
                          ? 'w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-md'
                          : 'w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-t-lg rounded-b-md';
                        const renderSeat = (seat: SeatResponse) => {
                          const isSelected = selectedSeatIds.includes(seat.id);
                          const isOccupied = seat.status !== 'AVAILABLE';
                          const tier = getSeatTier(seat);
                          const tierStyle = TIER_STYLES[tier];
                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat)}
                              disabled={isOccupied}
                              title={`${seat.rowLabel}${seat.number} · ${tierStyle.label}`}
                              className={`${sizeCls} text-[10px] sm:text-xs lg:text-sm shadow-sm transition-all
                                ${isSelected ? 'bg-brand text-white ring-2 ring-brand-ring shadow-md -translate-y-0.5' : ''}
                                ${!isSelected && !isOccupied ? `${tierStyle.seat} hover:-translate-y-0.5` : ''}
                                ${isOccupied ? 'bg-gray-300 text-gray-400 cursor-not-allowed opacity-60' : ''}
                              `}
                            >
                              {seat.number}
                            </button>
                          );
                        };
                        return (
                          <div
                            key={row}
                            className="flex items-center justify-center gap-2 sm:gap-3"
                          >
                            <div className="w-5 sm:w-6 text-center text-[10px] sm:text-xs text-gray-500 tabular-nums">
                              {row}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              {leftHalf.map(renderSeat)}
                            </div>
                            <div
                              className="w-8 sm:w-12 h-7 sm:h-9 lg:h-10 border-x border-dashed border-gray-300"
                              aria-hidden
                            />
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              {rightHalf.map(renderSeat)}
                            </div>
                            <div className="w-5 sm:w-6 text-center text-[10px] sm:text-xs text-gray-500 tabular-nums">
                              {row}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-2 text-center text-[10px] sm:text-xs text-gray-400 tracking-[0.3em]">
                    AISLE
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 예매 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 sticky top-24">
              <h2 className="text-gray-900 mb-4">예매 정보</h2>

              {activeFloor && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-brand" />
                    <span>{activeFloor.label}</span>
                  </div>
                </div>
              )}

              {/* 선택 좌석 — 좌석마다 등급 배지 + 가격 표시 */}
              <div className="mb-4">
                <h3 className="text-gray-900 mb-3">선택한 좌석</h3>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm text-gray-500">좌석을 선택해주세요</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSeats.map((seat) => {
                      const tier = getSeatTier(seat);
                      const style = TIER_STYLES[tier];
                      const price = getSeatPrice(seat);
                      return (
                        <div
                          key={seat.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Ticket className="w-4 h-4 text-brand shrink-0" />
                            <span className="text-sm text-gray-900">
                              {seat.rowLabel}{seat.number}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${style.badge}`}
                            >
                              {style.label}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {price.toLocaleString()}원
                            </span>
                          </div>
                          <button
                            onClick={() => toggleSeat(seat)}
                            className="p-1 hover:bg-gray-200 rounded shrink-0"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 쿠폰 선택 */}
              {coupons.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-gray-900 mb-2">쿠폰 적용</h3>
                  <select
                    value={selectedCouponId ?? ''}
                    onChange={(e) =>
                      setSelectedCouponId(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="">쿠폰 선택 안함</option>
                    {coupons.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (
                        {c.discountType === 'FIXED'
                          ? `${c.discountValue.toLocaleString()}원 할인`
                          : `${c.discountValue}% 할인`}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 가격 */}
              <div className="mb-6 pb-6 border-b border-gray-200 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>선택 좌석 수</span>
                  <span>{selectedSeats.length}석</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>좌석 금액</span>
                  <span>{totalPrice.toLocaleString()}원</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>쿠폰 할인</span>
                    <span>-{discountAmount.toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-900">최종 금액</span>
                  <span className="text-brand">{finalPrice.toLocaleString()}원</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={selectedSeatIds.length === 0 || submitting}
                className="w-full py-4 bg-gradient-to-r from-brand to-accent text-white rounded-xl hover:from-brand-hover hover:to-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> 처리 중...
                  </span>
                ) : selectedSeatIds.length === 0 ? (
                  '좌석을 선택해주세요'
                ) : (
                  '예매하기'
                )}
              </button>

              <div className="mt-4 p-3 bg-accent-soft rounded-lg">
                <ul className="text-xs text-accent-soft-fg space-y-1">
                  <li>• 최대 4석까지 선택 가능합니다.</li>
                  <li>• 예매 취소는 공연 3일 전까지 가능합니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
