import { useState } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Ticket,
  Calendar,
  MapPin,
  ChevronRight,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { AuthUser } from '../contexts/AppContexts';
import type { BookingSummaryResponse } from '../api/types';
import { cancelBooking } from '../api/bookings';
import dayjs from 'dayjs';

interface MyPageProps {
  user: AuthUser | null;
  bookings: BookingSummaryResponse[];
  loading: boolean;
  onBack: () => void;
  onBookingClick: (bookingId: number) => void;
  onRefresh: () => void;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: '예매완료', color: 'bg-green-100 text-green-700' },
  PENDING: { label: '결제대기', color: 'bg-yellow-100 text-yellow-700' },
  CANCELLED: { label: '취소됨', color: 'bg-gray-100 text-gray-500' },
};

export function MyPage({ user, bookings, loading, onBack, onBookingClick, onRefresh }: MyPageProps) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-sm sm:text-base">로그인이 필요합니다</p>
          <button
            onClick={onBack}
            className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm sm:text-base"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  const handleCancel = async (bookingId: number) => {
    if (!confirm('예매를 취소하시겠습니까?')) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      onRefresh();
    } catch {
      alert('예매 취소에 실패했습니다');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>홈으로</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* 프로필 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:sticky lg:top-8">
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-3 sm:mb-4">
                  <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-gray-900 mb-1 text-lg sm:text-xl md:text-2xl">{user.name}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{user.role === 'ADMIN' ? '관리자' : '일반 회원'}</p>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 truncate">{user.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="bg-purple-50 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-xl sm:text-2xl text-purple-600 mb-1">{bookings.length}</div>
                  <div className="text-xs text-gray-600">예매 내역</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-xl sm:text-2xl text-blue-600 mb-1">
                    {bookings.reduce((sum, b) => sum + b.seatCount, 0)}
                  </div>
                  <div className="text-xs text-gray-600">관람 티켓</div>
                </div>
              </div>
            </div>
          </div>

          {/* 예매 내역 */}
          <div className="lg:col-span-2">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-gray-900 mb-2 text-lg sm:text-xl md:text-2xl">예매 내역</h2>
              <p className="text-gray-600 text-sm sm:text-base">총 {bookings.length}건</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-8 sm:p-12 text-center">
                <Ticket className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-gray-900 mb-2 text-base sm:text-lg">예매 내역이 없습니다</h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  마음에 드는 공연을 예매해보세요
                </p>
                <button
                  onClick={onBack}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm sm:text-base"
                >
                  공연 둘러보기
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {bookings.map((booking) => {
                  const statusInfo = STATUS_LABEL[booking.status] ?? {
                    label: booking.status,
                    color: 'bg-gray-100 text-gray-500',
                  };
                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 mr-2">
                            <h3 className="text-gray-900 mb-1 truncate text-sm sm:text-base md:text-lg">
                              {booking.showTitle}
                            </h3>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <button
                            onClick={() => onBookingClick(booking.id)}
                            className="text-purple-600 hover:text-purple-700 flex-shrink-0"
                          >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2 mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{dayjs(booking.scheduledAt).format('YYYY.MM.DD HH:mm')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{booking.venue}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                            <Ticket className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{booking.seatCount}석</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="text-purple-600 text-sm sm:text-base">
                            {booking.finalPrice.toLocaleString()}원
                          </div>
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border border-red-200 rounded-lg disabled:opacity-50"
                            >
                              {cancellingId === booking.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              취소
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
