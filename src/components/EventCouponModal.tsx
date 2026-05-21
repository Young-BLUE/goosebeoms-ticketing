import { useState, useEffect } from 'react';
import { X, Gift, Timer, CheckCircle, Sparkles, Tag } from 'lucide-react';
import type {Show, Event} from "../models/ticket-model.ts";

interface EventCouponModalProps {
    event: Event;
    shows: Show[];
    onClose: () => void;
    onClaim: (couponCode: string) => void;
}

export function EventCouponModal({ event, shows, onClose, onClaim }: EventCouponModalProps) {
    const [timeLeft, setTimeLeft] = useState(180); // 3분
    const [isClaiming, setIsClaiming] = useState(false);
    const [step, setStep] = useState<'info' | 'claiming' | 'success'>('info');

    useEffect(() => {
        if (step === 'info') {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        onClose();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [step, onClose]);

    const handleClaim = () => {
        setIsClaiming(true);
        setStep('claiming');

        setTimeout(() => {
            const couponCode = `${event.title.slice(0, 2).toUpperCase()}${event.discount || 0}${Date.now().toString().slice(-6)}`;
            setStep('success');

            setTimeout(() => {
                onClaim(couponCode);
            }, 2000);
        }, 1500);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const applicableShows = event.showIds
        ? shows.filter(show => event.showIds?.includes(show.id))
        : [];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4 animate-in">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {step === 'info' && (
                    <>
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6 text-white">
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white z-10"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>

                            <div className="text-center relative">
                                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
                                    <Gift className="w-7 h-7 sm:w-8 sm:h-8" />
                                </div>
                                <h2 className="text-white mb-2 text-lg sm:text-xl md:text-2xl">{event.title}</h2>
                                <p className="text-purple-100 text-sm sm:text-base">{event.subtitle}</p>

                                {/* Decorative */}
                                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 opacity-30 animate-pulse" />
                                <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 sm:w-6 sm:h-6 opacity-20 animate-pulse" />
                            </div>

                            {event.discount && (
                                <div className="mt-4 sm:mt-6 bg-white/20 backdrop-blur rounded-xl p-3 sm:p-4 text-center">
                                    <div className="text-4xl sm:text-5xl mb-2">{event.discount}%</div>
                                    <div className="text-xs sm:text-sm text-purple-100">할인 쿠폰</div>
                                </div>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-4 sm:p-6">
                            {/* Timer */}
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <div className="flex items-center gap-2 text-red-900">
                                        <Timer className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                        <span className="text-sm sm:text-base">남은 시간</span>
                                    </div>
                                    <div className="text-xl sm:text-2xl text-red-600">
                                        {minutes}:{seconds.toString().padStart(2, '0')}
                                    </div>
                                </div>
                                <div className="bg-red-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: `${(timeLeft / 180) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Coupon Stock */}
                            {event.remaining !== undefined && event.total && (
                                <div className="bg-purple-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                                        <span className="text-purple-900 text-sm sm:text-base">남은 쿠폰</span>
                                        <span className="text-lg sm:text-xl text-purple-600">
                      {event.remaining}/{event.total}
                    </span>
                                    </div>
                                    <div className="bg-purple-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 sm:h-3 rounded-full transition-all"
                                            style={{ width: `${(event.remaining / event.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-gray-900 mb-2 text-sm sm:text-base md:text-lg">이벤트 설명</h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    {event.description}
                                </p>
                            </div>

                            {/* Applicable Shows */}
                            {applicableShows.length > 0 && (
                                <div className="mb-4 sm:mb-6">
                                    <h3 className="text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">적용 가능 공연</h3>
                                    <div className="space-y-2">
                                        {applicableShows.map(show => (
                                            <div
                                                key={show.id}
                                                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg"
                                            >
                                                <img
                                                    src={show.image}
                                                    alt={show.title}
                                                    className="w-10 sm:w-12 aspect-[2/3] object-cover rounded flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs sm:text-sm text-gray-900 truncate">{show.title}</div>
                                                    <div className="text-xs text-gray-500 truncate">{show.period}</div>
                                                </div>
                                                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Benefits */}
                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">쿠폰 혜택</h3>
                                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-600">
                      {event.discount}% 즉시 할인
                    </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-600">
                      예매 시 자동 적용
                    </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-600">
                      발급일로부터 30일간 유효
                    </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-600">
                      중복 할인 불가
                    </span>
                                    </div>
                                </div>
                            </div>

                            {/* Period */}
                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                                <div className="text-xs sm:text-sm text-gray-600 mb-1">이벤트 기간</div>
                                <div className="text-gray-900 text-sm sm:text-base">{event.period}</div>
                            </div>

                            {/* Claim Button */}
                            <button
                                onClick={handleClaim}
                                disabled={isClaiming || timeLeft === 0}
                                className={`w-full py-3 sm:py-4 rounded-xl transition-all text-sm sm:text-base ${
                                    isClaiming || timeLeft === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 active:scale-95 shadow-lg'
                                }`}
                            >
                                {timeLeft === 0 ? '시간 종료' : '쿠폰 받기'}
                            </button>

                            <div className="mt-3 sm:mt-4 text-xs text-center text-gray-500">
                                ⚠️ 쿠폰 발급 후 취소가 불가능합니다
                            </div>
                        </div>
                    </>
                )}

                {step === 'claiming' && (
                    <div className="p-8 sm:p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full mb-4 sm:mb-6">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h3 className="text-gray-900 mb-2 text-base sm:text-lg">쿠폰 발급 중...</h3>
                        <p className="text-gray-600 text-sm sm:text-base">잠시만 기다려주세요</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-8 sm:p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full mb-4 sm:mb-6">
                            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
                        </div>
                        <h3 className="text-gray-900 mb-2 text-base sm:text-lg">쿠폰 발급 완료!</h3>
                        <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                            마이페이지에서 쿠폰을 확인하세요
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full animate-pulse">
                            <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-sm sm:text-base">{event.discount}% 할인 쿠폰</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
