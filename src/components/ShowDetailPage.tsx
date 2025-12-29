import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Gift, X, CheckCircle } from 'lucide-react';
import { CouponModal } from './CouponModal';
import type {Booking, Show, User} from "../models/ticket-model.ts";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ShowDetailPageProps {
    show: Show;
    user: User | null;
    onBack: () => void;
    onBooking: () => void;
    onLoginClick: () => void;
}

export function ShowDetailPage({ show, user, onBack, onBooking, onLoginClick }: ShowDetailPageProps) {
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [claimedCoupon, setClaimedCoupon] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const handleCouponClaim = (couponCode: string) => {
        setClaimedCoupon(couponCode);
        setShowCouponModal(false);
    };

    const handleBooking = () => {
        if (!user) {
            onLoginClick();
            return;
        }

        onBooking();
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>목록으로</span>
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                    {/* Left: Image */}
                    <div>
                        <div className="lg:sticky lg:top-24">
                            <img
                                src={show.image}
                                alt={show.title}
                                className="w-full rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl"
                            />
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div>
                        <div className="mb-4 sm:mb-6">
                            <h1 className="text-gray-900 mb-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl">{show.title}</h1>
                            <p className="text-gray-600 text-sm sm:text-base md:text-lg">{show.subtitle}</p>
                        </div>

                        {/* Coupon Section */}
                        {show.hasCoupon && (
                            <div className="mb-6 sm:mb-8">
                                {claimedCoupon ? (
                                    <div className="bg-green-50 border-2 border-green-500 rounded-xl p-3 sm:p-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-green-900 text-sm sm:text-base">쿠�� 발급 완료!</div>
                                                <div className="text-xs sm:text-sm text-green-700">
                                                    {show.couponDiscount}% 할인 쿠폰이 적용됩니다
                                                </div>
                                            </div>
                                            <div className="text-xs text-green-600 bg-green-100 px-2 sm:px-3 py-1 rounded whitespace-nowrap">
                                                {claimedCoupon}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex items-start gap-2 sm:gap-3 flex-1">
                                                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                                                <div>
                                                    <div className="text-purple-900 text-sm sm:text-base">
                                                        {show.couponDiscount}% 할인 쿠폰 발급 가능
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-purple-700">
                                                        지금 바로 쿠폰을 받으세요!
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowCouponModal(true)}
                                                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                                            >
                                                쿠폰 받기
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info */}
                        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <div className="text-xs sm:text-sm text-gray-500">장소</div>
                                    <div className="text-gray-900 text-sm sm:text-base">{show.venue}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <div className="text-xs sm:text-sm text-gray-500">공연기간</div>
                                    <div className="text-gray-900 text-sm sm:text-base">{show.period}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <div className="text-xs sm:text-sm text-gray-500">공연시간</div>
                                    <div className="text-gray-900 text-sm sm:text-base">{show.runtime}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3">
                                <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-1 flex-shrink-0" />
                                <div>
                                    <div className="text-xs sm:text-sm text-gray-500">가격</div>
                                    <div className="text-gray-900 text-sm sm:text-base">{show.price}</div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6 sm:mb-8">
                            <h3 className="text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg md:text-xl">공연 소개</h3>
                            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{show.description}</p>
                        </div>

                        {/* Cast */}
                        <div className="mb-6 sm:mb-8">
                            <h3 className="text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg md:text-xl">출연진</h3>
                            <div className="flex flex-wrap gap-2">
                                {show.cast.map((actor, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg text-sm sm:text-base"
                                    >
                    {actor}
                  </span>
                                ))}
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="mb-6 sm:mb-8">
                            <h3 className="text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg md:text-xl">공연 시간</h3>
                            <div className="space-y-1.5 sm:space-y-2">
                                {show.schedule.map((time, idx) => (
                                    <div key={idx} className="text-gray-600 text-sm sm:text-base">
                                        • {time}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Booking Section */}
                        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                            <h3 className="text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg md:text-xl">예매하기</h3>

                            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                <div>
                                    <label className="block text-xs sm:text-sm text-gray-600 mb-2">날짜</label>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date: Date|null) => setSelectedDate(date)}
                                        dateFormat="yyyy/MM/dd"
                                        placeholderText="yyyy/MM/dd"
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base"
                                        wrapperClassName={"w-full"}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm text-gray-600 mb-2">시간</label>
                                    <select
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base"
                                    >
                                        <option value="14:00">14:00</option>
                                        <option value="19:00">19:00</option>
                                        <option value="19:30">19:30</option>
                                        <option value="20:00">20:00</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm text-gray-600 mb-2">인원</label>
                                    <select
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base"
                                    >
                                        <option value="1">1명</option>
                                        <option value="2">2명</option>
                                        <option value="3">3명</option>
                                        <option value="4">4명</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                                <div className="flex justify-between mb-2 text-sm sm:text-base">
                                    <span className="text-gray-600">기본 금액</span>
                                    <span className="text-gray-900">
                    {(120000 * 2).toLocaleString()}원
                  </span>
                                </div>
                                {claimedCoupon && (
                                    <div className="flex justify-between mb-2 text-sm sm:text-base">
                                        <span className="text-gray-600">할인 ({show.couponDiscount}%)</span>
                                        <span className="text-red-500">
                      -{(120000 * 2 * (show.couponDiscount || 0) / 100).toLocaleString()}원
                    </span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-gray-200 text-sm sm:text-base">
                                    <span className="text-gray-900">최종 결제금액</span>
                                    <span className="text-purple-600">
                    {(
                        120000 * 2 * (1 - (claimedCoupon ? (show.couponDiscount || 0) / 100 : 0))
                    ).toLocaleString()}원
                  </span>
                                </div>
                            </div>

                            <button
                                onClick={handleBooking}
                                className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all text-sm sm:text-base"
                            >
                                예매하기
                            </button>

                            {!user && (
                                <p className="text-xs sm:text-sm text-gray-500 text-center mt-3">
                                    예매하려면 로그인이 필요합니다
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Coupon Modal */}
            {showCouponModal && (
                <CouponModal
                    showTitle={show.title}
                    discount={show.couponDiscount || 0}
                    onClose={() => setShowCouponModal(false)}
                    onClaim={handleCouponClaim}
                />
            )}
        </div>
    );
}
