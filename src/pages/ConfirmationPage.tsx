import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle, Ticket, Calendar, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { getBooking } from '../api/bookings';
import type { BookingResponse } from '../api/types';
import dayjs from 'dayjs';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const locationBooking = (location.state as { booking?: BookingResponse } | null)?.booking;

  const [booking, setBooking] = useState<BookingResponse | null>(locationBooking ?? null);
  const [loading, setLoading] = useState(!locationBooking);

  useEffect(() => {
    if (locationBooking || !bookingId) return;
    getBooking(Number(bookingId))
      .then(setBooking)
      .finally(() => setLoading(false));
  }, [bookingId, locationBooking]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">예매 정보를 찾을 수 없습니다</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-purple-600 text-white rounded-lg">
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-gray-900 mb-2">예매가 완료되었습니다!</h1>
          <p className="text-gray-600">예매 정보를 확인해주세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          {/* 티켓 헤더 */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ticket className="w-8 h-8" />
                <div>
                  <div className="text-sm opacity-90">예매번호</div>
                  <div className="text-xl">#{booking.id}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">예매일자</div>
                <div>{dayjs(booking.createdAt).format('YYYY.MM.DD')}</div>
              </div>
            </div>
          </div>

          {/* 티켓 바디 */}
          <div className="p-6">
            <h2 className="text-gray-900 mb-4">{booking.showTitle}</h2>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>{dayjs(booking.scheduledAt).format('YYYY년 MM월 DD일 HH:mm')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-5 h-5 text-purple-600" />
                <span>{booking.venue}</span>
              </div>
            </div>

            {/* 좌석 정보 */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-gray-900 mb-3">좌석 정보</h3>
              <div className="flex flex-wrap gap-2">
                {booking.seats.map((seat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm"
                  >
                    {seat.zone} {seat.rowLabel}{seat.number}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">총 {booking.seats.length}석</p>
            </div>

            {/* 결제 정보 */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-gray-900 mb-3">결제 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>좌석 금액</span>
                  <span>{booking.originalPrice.toLocaleString()}원</span>
                </div>
                {booking.discountPrice > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>할인</span>
                    <span>-{booking.discountPrice.toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 font-medium">
                  <span className="text-gray-900">최종 결제 금액</span>
                  <span className="text-purple-600">{booking.finalPrice.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-900">결제 완료</p>
              </div>
            </div>
          </div>

          {/* 점선 */}
          <div className="relative h-6 bg-gray-50">
            <div className="absolute inset-x-0 top-0 flex justify-between px-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-3 h-3 bg-white rounded-full -mt-1.5" />
              ))}
            </div>
          </div>

          {/* QR 섹션 */}
          <div className="bg-gray-50 p-6 text-center">
            <div className="inline-block bg-white p-4 rounded-xl mb-3">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded flex items-center justify-center">
                <div className="text-4xl">🎫</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">공연 당일 이 QR 코드를 제시해주세요</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-xl hover:bg-purple-50 transition-colors"
          >
            홈으로
          </button>
          <button
            onClick={() => navigate('/mypage')}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors"
          >
            예매 내역 보기
          </button>
        </div>
      </div>
    </div>
  );
}
