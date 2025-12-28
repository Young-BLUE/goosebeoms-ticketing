import { ArrowLeft, User as UserIcon, Mail, Phone, Ticket, Calendar, ChevronRight } from 'lucide-react';
import type {Booking, User} from "../models/ticket-model.ts";

interface MyPageProps {
    user: User | null;
    bookings: Booking[];
    onBack: () => void;
    onShowClick: (showId: number) => void;
}

export function MyPage({ user, bookings, onBack, onShowClick }: MyPageProps) {
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
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
                    {/* Left: User Profile */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:sticky lg:top-8">
                            <div className="text-center mb-4 sm:mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-3 sm:mb-4">
                                    <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>
                                <h2 className="text-gray-900 mb-1 text-lg sm:text-xl md:text-2xl">{user.name}</h2>
                                <p className="text-xs sm:text-sm text-gray-500">일반 회원</p>
                            </div>

                            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-600 truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-600">{user.phone}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <div className="bg-purple-50 rounded-lg p-2 sm:p-3 text-center">
                                    <div className="text-xl sm:text-2xl text-purple-600 mb-1">
                                        {bookings.length}
                                    </div>
                                    <div className="text-xs text-gray-600">예매 내역</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                                    <div className="text-xl sm:text-2xl text-blue-600 mb-1">
                                        {bookings.reduce((sum, b) => sum + b.seats.length, 0)}
                                    </div>
                                    <div className="text-xs text-gray-600">관람 티켓</div>
                                </div>
                            </div>

                            <button className="w-full py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mb-2 sm:mb-3 text-sm sm:text-base">
                                회원정보 수정
                            </button>
                            <button className="w-full py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base">
                                쿠폰함
                            </button>
                        </div>
                    </div>

                    {/* Right: Bookings */}
                    <div className="lg:col-span-2">
                        <div className="mb-4 sm:mb-6">
                            <h2 className="text-gray-900 mb-2 text-lg sm:text-xl md:text-2xl">예매 내역</h2>
                            <p className="text-gray-600 text-sm sm:text-base">
                                총 {bookings.length}건의 예매 내역이 있습니다
                            </p>
                        </div>

                        {bookings.length === 0 ? (
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
                                {bookings.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
                                            <img
                                                src={booking.showImage}
                                                alt={booking.showTitle}
                                                className="w-full sm:w-24 md:w-32 h-48 sm:h-32 md:h-40 object-cover rounded-lg flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2 sm:mb-3">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <h3 className="text-gray-900 mb-1 truncate text-sm sm:text-base md:text-lg">
                                                            {booking.showTitle}
                                                        </h3>
                                                        <div className="inline-block px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                            예매완료
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => onShowClick(booking.showId)}
                                                        className="text-purple-600 hover:text-purple-700 flex-shrink-0"
                                                    >
                                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </button>
                                                </div>

                                                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                        <span className="truncate">
                              {new Date(booking.date).toLocaleDateString('ko-KR')} {booking.time}
                            </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                                                        <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                        <span className="truncate">
                              {booking.seats.join(', ')} ({booking.seats.length}석)
                            </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 sm:pt-3 border-t border-gray-100 gap-2 sm:gap-0">
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">결제금액</div>
                                                        <div className="text-purple-600 text-sm sm:text-base">
                                                            {booking.totalPrice.toLocaleString()}원
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 w-full sm:w-auto">
                                                        <button className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200">
                                                            상세보기
                                                        </button>
                                                        <button className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm hover:bg-purple-700">
                                                            QR 확인
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Additional Sections */}
                        <div className="mt-6 sm:mt-8 grid md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                                <h3 className="text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">관심 공연</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                    관심있는 공연을 저장하고 알림을 받아보세요
                                </p>
                                <button className="text-xs sm:text-sm text-purple-600 hover:text-purple-700">
                                    관심 공연 관리 →
                                </button>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                                <h3 className="text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">리뷰 작성</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                    관람한 공연에 대한 리뷰를 남겨주세요
                                </p>
                                <button className="text-xs sm:text-sm text-purple-600 hover:text-purple-700">
                                    리뷰 작성하기 →
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-sm p-4 sm:p-6">
                            <h3 className="text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg">최근 활동</h3>
                            <div className="space-y-2 sm:space-y-3">
                                {bookings.slice(0, 3).map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="flex items-center justify-between py-2 text-xs sm:text-sm"
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full flex-shrink-0" />
                                            <span className="text-gray-600 truncate">
                        {booking.showTitle} 예매 완료
                      </span>
                                        </div>
                                        <span className="text-gray-400 whitespace-nowrap text-xs">
                      {new Date(booking.bookingDate).toLocaleDateString('ko-KR')}
                    </span>
                                    </div>
                                ))}
                                {bookings.length === 0 && (
                                    <p className="text-xs sm:text-sm text-gray-400 text-center py-4">
                                        최근 활동이 없습니다
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
