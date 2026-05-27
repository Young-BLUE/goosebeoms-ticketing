import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, MapPin, Ticket, X, Loader2 } from 'lucide-react';
import { getZones, getSeats, subscribeSeats } from '../api/schedules';
import { getMyCoupons } from '../api/coupons';
import { holdBooking } from '../api/bookings';
import type {
  ZoneResponse,
  SeatResponse,
  UserCouponResponse,
  SeatStatusEvent,
} from '../api/types';

interface SeatSelectionPageProps {
  scheduleId: number;
  queueToken: string | null;
  onBack: () => void;
  onComplete: (bookingId: number) => void;
}

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
  // 좌석 데이터 — id → SeatResponse 맵. SSE 부분 갱신을 위해 Map 자료형.
  const [seatsById, setSeatsById] = useState<Map<number, SeatResponse>>(new Map());
  const [coupons, setCoupons] = useState<UserCouponResponse[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<number | undefined>(undefined);
  const [activeFloorIdx, setActiveFloorIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // 초기 로드 — zones 가져온 뒤 zone별 seats를 병렬로 페치. SSE 구독으로 실시간 갱신.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [z, c] = await Promise.all([
          getZones(scheduleId),
          getMyCoupons().catch(() => [] as UserCouponResponse[]),
        ]);
        if (cancelled) return;
        setZones(z);
        setCoupons(c.filter((c) => c.status === 'ISSUED'));

        // zone마다 따로 좌석 페치 (백엔드 계약: ?zoneId=N)
        const seatBuckets = await Promise.all(
          z.map((zone) => getSeats(scheduleId, zone.id).catch(() => [] as SeatResponse[])),
        );
        if (cancelled) return;
        const map = new Map<number, SeatResponse>();
        for (let i = 0; i < z.length; i++) {
          for (const s of seatBuckets[i]) {
            // 응답에 zoneId가 없으면 호출 컨텍스트로 채워 넣음 (그리드 분배에 필요)
            map.set(s.id, { ...s, zoneId: s.zoneId ?? z[i].id });
          }
        }
        setSeatsById(map);

        // SSE 구독 — 다른 사용자의 hold/booking/release 가 들어오면 부분 갱신
        const es = subscribeSeats(
          scheduleId,
          (ev: SeatStatusEvent) => {
            if (cancelled) return;
            setSeatsById((prev) => {
              const next = new Map(prev);
              for (const ch of ev.changes) {
                const existing = next.get(ch.seatId);
                if (existing) next.set(ch.seatId, { ...existing, status: ch.status });
              }
              return next;
            });
          },
          () => {
            // SSE 끊김은 치명적이지 않음 (스냅샷은 이미 있음). 로그만 남김.
            console.warn('seat SSE disconnected');
          },
        );
        esRef.current = es;
      } catch {
        if (!cancelled) setError('좌석 정보를 불러오는데 실패했습니다');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      esRef.current?.close();
    };
  }, [scheduleId]);

  const floors = useMemo(() => groupZonesByFloor(zones), [zones]);
  const activeFloor = floors[activeFloorIdx] ?? floors[0];
  const floorZones = useMemo(() => activeFloor?.zones ?? [], [activeFloor]);

  // 첫 번째가 아닌 floor는 "상층(발코니)"으로 취급 — 좌석 크기/모양 차별화
  const isUpperFloor = activeFloorIdx > 0;

  // floor 전환 시 선택 좌석 초기화
  useEffect(() => {
    setSelectedSeatIds([]);
  }, [activeFloorIdx]);

  // zone → 등급 매핑 + zone 정렬(가격 내림차순: VIP가 무대 가까이)
  const zoneTierMap = useMemo(() => {
    const m: Record<number, ZoneTier> = {};
    for (const z of zones) m[z.id] = getZoneTier(z, zones);
    return m;
  }, [zones]);

  const sortedFloorZones = useMemo(
    () =>
      [...floorZones].sort(
        (a, b) => b.price - a.price || a.id - b.id, // 결정론적 — 같은 가격이면 id asc
      ),
    [floorZones],
  );

  // 등급별 대표 zone (상단 등급 안내 카드용)
  const tierZoneMap = useMemo(() => {
    const m: Partial<Record<ZoneTier, ZoneResponse>> = {};
    for (const z of sortedFloorZones) {
      const t = zoneTierMap[z.id] ?? 'a';
      if (!(t in m)) m[t] = z;
    }
    return m;
  }, [sortedFloorZones, zoneTierMap]);

  // 좌석을 zoneId 별로 묶고, 각 zone 안에서 (rowLabel, number) → SeatResponse 맵 생성
  const seatsByZone = useMemo(() => {
    const m = new Map<number, Map<string, SeatResponse>>();
    for (const seat of seatsById.values()) {
      if (seat.zoneId == null) continue;
      let inner = m.get(seat.zoneId);
      if (!inner) {
        inner = new Map();
        m.set(seat.zoneId, inner);
      }
      inner.set(`${seat.rowLabel}-${seat.number}`, seat);
    }
    return m;
  }, [seatsById]);

  const selectedSeats = useMemo(
    () =>
      selectedSeatIds
        .map((id) => seatsById.get(id))
        .filter((s): s is SeatResponse => s !== undefined),
    [seatsById, selectedSeatIds],
  );

  const totalPrice = selectedSeats.reduce((sum, seat) => {
    const zone = zones.find((z) => z.id === seat.zoneId);
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
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

  if (error && seatsById.size === 0) {
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

  const visibleTiers = TIER_ORDER.filter((t) => tierZoneMap[t]);
  const seatShape = isUpperFloor ? 'rounded-md' : 'rounded-t-md rounded-b';
  const sizeCls = isUpperFloor
    ? 'w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-md'
    : 'w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-t-lg rounded-b-md';

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

              {/* 좌석 등급 안내 */}
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
                  무대에 가까운 등급(VIP)이 위쪽, 멀어질수록 하위 등급(R · S)으로 배치됩니다.
                </p>
              </div>

              {/* STAGE / BALCONY */}
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

              {/* 좌석 상태 범례 */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-brand ${seatShape} shadow-sm`} />
                  <span className="text-xs sm:text-sm text-gray-600">선택됨</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 ${seatShape} shadow-sm opacity-60`}
                  />
                  <span className="text-xs sm:text-sm text-gray-600">예매완료</span>
                </div>
              </div>

              {/* 좌석 배치도 — zone마다 격자를 세로로 쌓는다.
                  무대 가까이 = VIP, 멀수록 = 하위 등급. 가로 가운데 정렬로 무대 중심을 맞춤. */}
              {sortedFloorZones.length === 0 ? (
                <p className="text-center text-gray-500 py-8">좌석 정보가 없습니다</p>
              ) : (
                <div className="overflow-x-auto pb-3 px-2 sm:px-6 lg:px-8">
                  <div
                    className="w-max mx-auto space-y-8 sm:space-y-10"
                    style={{ perspective: isUpperFloor ? '1200px' : '1600px' }}
                  >
                    {sortedFloorZones.map((zone) => {
                      const tier = zoneTierMap[zone.id] ?? 'a';
                      const tierStyle = TIER_STYLES[tier];
                      const zoneSeatMap = seatsByZone.get(zone.id) ?? new Map<string, SeatResponse>();
                      const rowCount = Math.max(zone.rowCount || 0, 0);
                      const colCount = Math.max(zone.columnCount || 0, 0);
                      if (rowCount === 0 || colCount === 0) return null;
                      const rowLabels = Array.from({ length: rowCount }, (_, r) =>
                        String.fromCharCode(65 + r),
                      );

                      return (
                        <div key={zone.id} className="flex flex-col items-center">
                          {/* zone 헤더 — 등급 라벨 + 가격 */}
                          <div className="mb-2 sm:mb-3 inline-flex items-center gap-2 text-xs sm:text-sm">
                            <span
                              aria-hidden
                              className={`inline-block w-2.5 h-2.5 rounded-full ${tierStyle.dot} ring-1 ring-black/10`}
                            />
                            <span className="font-medium text-gray-900">{zone.name}</span>
                            <span className="text-gray-500">
                              ({zone.price.toLocaleString()}원 · {zone.availableSeats}석 남음)
                            </span>
                          </div>

                          <div
                            className="space-y-1.5 sm:space-y-2"
                            style={{
                              transform: `rotateX(${isUpperFloor ? 14 : 8}deg)`,
                              transformOrigin: 'top center',
                            }}
                          >
                            {rowLabels.map((rowLabel) => (
                              <div
                                key={rowLabel}
                                className="flex items-center justify-center gap-1 sm:gap-1.5"
                              >
                                <div className="w-5 sm:w-6 text-center text-[10px] sm:text-xs text-gray-500 tabular-nums">
                                  {rowLabel}
                                </div>
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                  {Array.from({ length: colCount }, (_, c) => {
                                    const num = c + 1;
                                    const seat = zoneSeatMap.get(`${rowLabel}-${num}`);
                                    if (!seat) {
                                      // 백엔드 좌석이 없는 셀 → 빈칸 (가짜 ID 생성 금지)
                                      return (
                                        <div
                                          key={`empty-${rowLabel}-${num}`}
                                          aria-hidden
                                          className={`${sizeCls} bg-transparent`}
                                        />
                                      );
                                    }
                                    const isSelected = selectedSeatIds.includes(seat.id);
                                    const isOccupied = seat.status !== 'AVAILABLE';
                                    return (
                                      <button
                                        key={seat.id}
                                        onClick={() => toggleSeat(seat)}
                                        disabled={isOccupied}
                                        title={`${zone.name} ${seat.rowLabel}${seat.number} · ${tierStyle.label}`}
                                        className={`${sizeCls} text-[10px] sm:text-xs lg:text-sm shadow-sm transition-all
                                          ${isSelected ? 'bg-brand text-white ring-2 ring-brand-ring shadow-md -translate-y-0.5' : ''}
                                          ${!isSelected && !isOccupied ? `${tierStyle.seat} hover:-translate-y-0.5` : ''}
                                          ${isOccupied ? 'bg-gray-300 text-gray-400 cursor-not-allowed opacity-60' : ''}
                                        `}
                                      >
                                        {seat.number}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="w-5 sm:w-6 text-center text-[10px] sm:text-xs text-gray-500 tabular-nums">
                                  {rowLabel}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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

              {/* 선택 좌석 */}
              <div className="mb-4">
                <h3 className="text-gray-900 mb-3">선택한 좌석</h3>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm text-gray-500">좌석을 선택해주세요</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSeats.map((seat) => {
                      const zone = zones.find((z) => z.id === seat.zoneId);
                      const tier = zone ? (zoneTierMap[zone.id] ?? 'a') : 'a';
                      const style = TIER_STYLES[tier];
                      const price = zone?.price ?? 0;
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
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.badge}`}>
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
