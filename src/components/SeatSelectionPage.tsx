import { useState, useEffect } from 'react';
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
  const rowToZoneId = (() => {
    const map: Record<string, number> = {};
    let charCode = 'A'.charCodeAt(0);
    for (const zone of zones) {
      for (let i = 0; i < zone.rowCount; i++) {
        map[String.fromCharCode(charCode++)] = zone.id;
      }
    }
    return map;
  })();

  const getSeatZoneId = (seat: SeatResponse) =>
    seat.zoneId ?? rowToZoneId[seat.rowLabel] ?? zones[0]?.id;

  const zoneSeats = seats.filter((s) => getSeatZoneId(s) === activeZoneId);

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));

  const activeZone = zones.find((z) => z.id === activeZoneId);

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
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && seats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={onBack} className="px-6 py-3 bg-purple-600 text-white rounded-lg">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 좌석을 row별로 그룹
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 좌석 선택 영역 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              {/* 구역 탭 */}
              <div className="mb-6">
                <h2 className="text-gray-900 mb-3">구역 선택</h2>
                <div className="flex gap-2 flex-wrap">
                  {zones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => {
                        setActiveZoneId(zone.id);
                        setSelectedSeatIds([]);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        activeZoneId === zone.id
                          ? 'bg-purple-600 text-white'
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

              {/* 스테이지 */}
              <div className="bg-gradient-to-b from-purple-100 to-purple-50 rounded-t-full py-3 sm:py-4 text-center mb-6">
                <span className="text-sm sm:text-base text-purple-900">STAGE</span>
              </div>

              {/* 좌석 범례 */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                {[
                  { color: 'bg-purple-200', label: '선택 가능' },
                  { color: 'bg-purple-600', label: '선택됨' },
                  { color: 'bg-gray-300', label: '예매완료' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-6 h-6 ${color} rounded`} />
                    <span className="text-xs sm:text-sm text-gray-600">{label}</span>
                  </div>
                ))}
              </div>

              {/* 좌석 배치도 */}
              {rows.length === 0 ? (
                <p className="text-center text-gray-500 py-8">이 구역의 좌석 정보가 없습니다</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[400px] space-y-2 sm:space-y-3">
                    {rows.map((row) => (
                      <div key={row} className="flex items-center justify-center gap-1 sm:gap-2">
                        <div className="w-6 sm:w-8 text-center text-xs sm:text-sm text-gray-600">
                          {row}
                        </div>
                        {groupedByRow[row]
                          .sort((a, b) => a.number - b.number)
                          .map((seat) => {
                            const isSelected = selectedSeatIds.includes(seat.id);
                            const isOccupied = seat.status !== 'AVAILABLE';
                            return (
                              <button
                                key={seat.id}
                                onClick={() => toggleSeat(seat)}
                                disabled={isOccupied}
                                className={`w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded text-xs sm:text-sm transition-all
                                  ${isSelected ? 'bg-purple-600 text-white ring-2 ring-purple-400' : ''}
                                  ${!isSelected && !isOccupied ? 'bg-purple-200 hover:bg-purple-300 text-purple-900' : ''}
                                  ${isOccupied ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}
                                `}
                              >
                                {seat.number}
                              </button>
                            );
                          })}
                        <div className="w-6 sm:w-8 text-center text-xs sm:text-sm text-gray-600">
                          {row}
                        </div>
                      </div>
                    ))}
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
                    <MapPin className="w-4 h-4 text-purple-600" />
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
                          <Ticket className="w-4 h-4 text-purple-600" />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  <span className="text-purple-600">{finalPrice.toLocaleString()}원</span>
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
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <ul className="text-xs text-blue-700 space-y-1">
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
