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
  // 1) 중앙 명당이 많이 차 있음
  (r, c, rC, cC, rnd) => {
    const midRow = r >= rC * 0.2 && r <= rC * 0.65;
    const midCol = c >= cC * 0.25 && c <= cC * 0.75;
    return midRow && midCol && rnd() < 0.55;
  },
  // 2) 산발적으로 약 22%
  (_r, _c, _rC, _cC, rnd) => rnd() < 0.22,
  // 3) 뒤쪽 행으로 갈수록 점유율 증가
  (r, _c, rC, _cC, rnd) => rnd() < (r / Math.max(rC - 1, 1)) * 0.7 + 0.05,
  // 4) 앞쪽 행 위주로 점유 (앞자리 인기)
  (r, _c, rC, _cC, rnd) => rnd() < (1 - r / Math.max(rC - 1, 1)) * 0.7 + 0.05,
  // 5) 격행 패턴 — 짝수 행이 많이 차 있음
  (r, _c, _rC, _cC, rnd) => r % 2 === 0 && rnd() < 0.65,
  // 6) 가장자리는 비고 중앙 컬럼이 차 있음
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

function buildSeatGrid(
  zoneId: number,
  backendSeats: SeatResponse[],
  rowCountHint: number,
  columnCountHint: number,
  prebookedKeys: Set<string>,
): SeatResponse[] {
  const rowCount = Math.max(rowCountHint || 0, MIN_ROWS);
  const columnCount = Math.max(columnCountHint || 0, MIN_COLS);
  const aBase = 'A'.charCodeAt(0);
  const map = new Map<string, SeatResponse>();
  let synthId = -1_000_000 - zoneId * 10_000;
  for (let r = 0; r < rowCount; r++) {
    const rowLabel = String.fromCharCode(aBase + r);
    for (let n = 1; n <= columnCount; n++) {
      const key = `${rowLabel}-${n}`;
      map.set(key, {
        id: synthId--,
        rowLabel,
        number: n,
        status: prebookedKeys.has(key) ? 'BOOKED' : 'AVAILABLE',
        zoneId,
      });
    }
  }
  // 백엔드가 내려준 좌석은 시드 + 프리셋보다 우선
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
  const [activeZoneId, setActiveZoneId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getZones(scheduleId), getSeats(scheduleId), getMyCoupons().catch(() => [])])
      .then(([z, s, c]) => {
        setZones(z);
        setSeats(s);
        setCoupons(c.filter((c) => c.status === 'ISSUED'));
        setActiveZoneId(z[0]?.id ?? null);
      })
      .catch(() => setError('좌석 정보를 불러오는데 실패했습니다'))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  // zones의 rowCount로 행 범위를 계산해 각 좌석이 어느 zone에 속하는지 판단
  const rowToZoneId = useMemo(() => {
    const map: Record<string, number> = {};
    let charCode = 'A'.charCodeAt(0);
    for (const zone of zones) {
      for (let i = 0; i < zone.rowCount; i++) {
        map[String.fromCharCode(charCode++)] = zone.id;
      }
    }
    return map;
  }, [zones]);

  const getSeatZoneId = (seat: SeatResponse) =>
    seat.zoneId ?? rowToZoneId[seat.rowLabel] ?? zones[0]?.id;

  // 층(floor) 그룹화 — 백엔드 zones를 클라이언트에서 1층/2층으로 분배
  const floors = useMemo(() => groupZonesByFloor(zones), [zones]);
  const activeFloor = floors[activeFloorIdx] ?? floors[0];
  const visibleZones = activeFloor?.zones ?? zones;

  // 활성 floor가 바뀌었을 때 zone 자동 보정
  useEffect(() => {
    if (!activeFloor) return;
    if (!activeFloor.zones.some((z) => z.id === activeZoneId)) {
      setActiveZoneId(activeFloor.zones[0]?.id ?? null);
      setSelectedSeatIds([]);
    }
  }, [activeFloor, activeZoneId]);

  const activeZone = zones.find((z) => z.id === activeZoneId);

  // 진입할 때마다 새 seed/패턴 — scheduleId가 바뀌면 다시 결정한다.
  const prebookSeed = useMemo(
    () => Math.floor(Math.random() * 1_000_000) + 1,
    [scheduleId],
  );
  const prebookedPattern = useMemo(
    () => PREBOOKED_PATTERNS[Math.floor(Math.random() * PREBOOKED_PATTERNS.length)],
    [scheduleId],
  );

  // 활성 zone의 좌석 — 백엔드 데이터 + 시드 격자(랜덤 프리셋으로 일부 BOOKED)
  const zoneSeats = useMemo(() => {
    if (!activeZone) return [];
    const backendSeats = seats.filter((s) => getSeatZoneId(s) === activeZone.id);
    const rowCount = Math.max(activeZone.rowCount || 0, MIN_ROWS);
    const colCount = Math.max(activeZone.columnCount || 0, MIN_COLS);
    // zoneId를 seed에 섞어 zone별로 다른 분포가 나오게 한다.
    const rand = mulberry32(prebookSeed + activeZone.id * 7919);
    const prebookedKeys = new Set<string>();
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        if (prebookedPattern(r, c, rowCount, colCount, rand)) {
          prebookedKeys.add(`${String.fromCharCode(65 + r)}-${c + 1}`);
        }
      }
    }
    return buildSeatGrid(
      activeZone.id,
      backendSeats,
      activeZone.rowCount,
      activeZone.columnCount,
      prebookedKeys,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeZone, seats, rowToZoneId, prebookSeed, prebookedPattern]);

  const selectedSeats = useMemo(
    () => {
      const all = [...seats, ...zoneSeats];
      const dedup = new Map<number, SeatResponse>();
      for (const s of all) dedup.set(s.id, s);
      return Array.from(dedup.values()).filter((s) => selectedSeatIds.includes(s.id));
    },
    [seats, zoneSeats, selectedSeatIds],
  );

  const totalPrice = selectedSeats.reduce((sum, seat) => {
    const zone = zones.find((z) => z.id === getSeatZoneId(seat));
    return sum + (zone?.price ?? 0);
  }, 0);

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

  // 좌석을 row별로 그룹 (시드 격자가 1번부터 A행부터 보장하므로 별도 정렬만)
  const groupedByRow = zoneSeats.reduce<Record<string, SeatResponse[]>>((acc, seat) => {
    if (!acc[seat.rowLabel]) acc[seat.rowLabel] = [];
    acc[seat.rowLabel].push(seat);
    return acc;
  }, {});
  const rows = Object.keys(groupedByRow).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
              {/* 층(floor) 탭 — 두 개 이상일 때만 노출 */}
              {floors.length > 1 && (
                <div className="mb-4 sm:mb-5">
                  <div className="inline-flex rounded-xl bg-gray-100 p-1">
                    {floors.map((f, idx) => (
                      <button
                        key={f.label}
                        onClick={() => {
                          setActiveFloorIdx(idx);
                          setSelectedSeatIds([]);
                        }}
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

              {/* 구역 탭 */}
              <div className="mb-6">
                <h2 className="text-gray-900 mb-3">
                  {floors.length > 1 ? `${activeFloor?.label ?? ''} 구역 선택` : '구역 선택'}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {visibleZones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => {
                        setActiveZoneId(zone.id);
                        setSelectedSeatIds([]);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        activeZoneId === zone.id
                          ? 'bg-brand text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {zone.name}{' '}
                      <span className="text-xs opacity-75">
                        ({zone.price.toLocaleString()}원 / {zone.availableSeats}석 남음)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* STAGE — 사다리꼴 무대 + 조명 그림자 */}
              <div className="relative mb-8 sm:mb-10">
                <div className="absolute inset-x-8 sm:inset-x-16 -bottom-3 h-6 bg-brand/20 blur-2xl" />
                <div
                  className="relative mx-auto bg-gradient-to-b from-neutral-700 to-neutral-900 text-white text-center py-3 sm:py-4 shadow-xl"
                  style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)', width: '78%' }}
                >
                  <span className="tracking-[0.4em] text-sm sm:text-base">STAGE</span>
                </div>
              </div>

              {/* 좌석 범례 */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { color: 'bg-neutral-200', label: '선택 가능' },
                  { color: 'bg-brand', label: '선택됨' },
                  { color: 'bg-gray-300', label: '예매완료' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 ${color} rounded-t-md rounded-b shadow-sm`} />
                    <span className="text-xs sm:text-sm text-gray-600">{label}</span>
                  </div>
                ))}
              </div>

              {/* 좌석 배치도 — perspective 원근감 + 중앙 통로 */}
              {rows.length === 0 ? (
                <p className="text-center text-gray-500 py-8">이 구역의 좌석 정보가 없습니다</p>
              ) : (
                <div className="overflow-x-auto pb-3 px-2 sm:px-6 lg:px-8">
                  {/*
                    w-max: wrapper가 콘텐츠(가장 넓은 row) 너비만큼 확장 → 좁은 viewport에서 좌측 좌석이 잘리지 않고 스크롤로 도달 가능.
                    mx-auto: wrapper가 컨테이너보다 좁으면 가운데 정렬, 더 넓으면 좌측 정렬 + 가로 스크롤.
                  */}
                  <div
                    className="w-max mx-auto"
                    style={{ perspective: '1600px' }}
                  >
                    <div
                      className="space-y-1.5 sm:space-y-2"
                      style={{ transform: 'rotateX(10deg)', transformOrigin: 'top center' }}
                    >
                      {rows.map((row) => {
                        const seatsInRow = groupedByRow[row].sort((a, b) => a.number - b.number);
                        const half = Math.ceil(seatsInRow.length / 2);
                        const leftHalf = seatsInRow.slice(0, half);
                        const rightHalf = seatsInRow.slice(half);
                        const renderSeat = (seat: SeatResponse) => {
                          const isSelected = selectedSeatIds.includes(seat.id);
                          const isOccupied = seat.status !== 'AVAILABLE';
                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat)}
                              disabled={isOccupied}
                              title={`${seat.rowLabel}${seat.number}`}
                              className={`w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-t-lg rounded-b-md text-[10px] sm:text-xs lg:text-sm shadow-sm transition-all
                                ${isSelected ? 'bg-brand text-white ring-2 ring-brand-ring shadow-md -translate-y-0.5' : ''}
                                ${!isSelected && !isOccupied ? 'bg-neutral-200 text-gray-900 hover:bg-neutral-300 hover:-translate-y-0.5' : ''}
                                ${isOccupied ? 'bg-gray-300 text-gray-400 cursor-not-allowed opacity-60' : ''}
                              `}
                            >
                              {seat.number}
                            </button>
                          );
                        };
                        return (
                          <div key={row} className="flex items-center justify-center gap-2 sm:gap-3">
                            <div className="w-5 sm:w-6 text-center text-[10px] sm:text-xs text-gray-500 tabular-nums">
                              {row}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              {leftHalf.map(renderSeat)}
                            </div>
                            {/* 중앙 통로 — 점선 가이드로 강조 */}
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
                  {/* AISLE 라벨 — 통로 위치에 가운데 정렬 */}
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

              {activeZone && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-brand" />
                    <span>
                      {activeZone.name} — {activeZone.price.toLocaleString()}원/석
                    </span>
                  </div>
                </div>
              )}

              {/* 선택 좌석 */}
              <div className="mb-4">
                <h3 className="text-gray-900 mb-3">선택한 좌석</h3>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm text-gray-500">좌석을 선택해주세요</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedSeats.map((seat) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-brand" />
                          <span className="text-sm text-gray-900">
                            {seat.rowLabel}{seat.number}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleSeat(seat)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ))}
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
