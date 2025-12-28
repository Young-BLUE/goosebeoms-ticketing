import { useState, useEffect } from 'react';
import { X, Gift, Timer, Sparkles } from 'lucide-react';

interface CouponModalProps {
    showTitle: string;
    discount: number;
    onClose: () => void;
    onClaim: (couponCode: string) => void;
}

export function CouponModal({ showTitle, discount, onClose, onClaim }: CouponModalProps) {
    const [timeLeft, setTimeLeft] = useState(300); // 5분
    const [remaining, setRemaining] = useState(47);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
            if (Math.random() > 0.7) {
                setRemaining(prev => Math.max(1, prev - 1));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleClaim = () => {
        setIsClaiming(true);
        const couponCode = `${showTitle.slice(0, 2).toUpperCase()}${discount}${Date.now().toString().slice(-6)}`;

        setTimeout(() => {
            onClaim(couponCode);
        }, 1500);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full overflow-hidden animate-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6 text-white relative overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-white text-lg sm:text-xl md:text-2xl">쿠폰 발급</h2>
                            <p className="text-purple-100 text-xs sm:text-sm truncate">{showTitle}</p>
                        </div>
                    </div>

                    {/* Discount Badge */}
                    <div className="bg-white/20 backdrop-blur rounded-xl p-3 sm:p-4 text-center">
                        <div className="text-3xl sm:text-4xl mb-1">{discount}%</div>
                        <div className="text-xs sm:text-sm text-purple-100">할인 쿠폰</div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 opacity-10">
                        <Sparkles className="w-24 sm:w-32 h-24 sm:h-32" />
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6">
                    {/* Timer */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-900">
                                <Timer className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                <span className="text-sm sm:text-base">남은 시간</span>
                            </div>
                            <div className="text-red-600 text-lg sm:text-xl">
                                {minutes}:{seconds.toString().padStart(2, '0')}
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-3 bg-red-200 rounded-full h-2">
                            <div
                                className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${(timeLeft / 300) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Remaining Count */}
                    <div className="bg-purple-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-purple-900 text-sm sm:text-base">남은 쿠폰</span>
                            <span className="text-purple-600 text-base sm:text-lg">{remaining}/100</span>
                        </div>
                        <div className="bg-purple-200 rounded-full h-2.5 sm:h-3">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
                                style={{ width: `${remaining}%` }}
                            />
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="mb-4 sm:mb-6">
                        <h3 className="text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg">쿠폰 혜택</h3>
                        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-600 rounded-full flex-shrink-0" />
                                전 좌석 {discount}% 할인
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-600 rounded-full flex-shrink-0" />
                                예매 시 자동 적용
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-600 rounded-full flex-shrink-0" />
                                1인 1회 발급 가능
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-600 rounded-full flex-shrink-0" />
                                발급일로부터 30일간 유효
                            </li>
                        </ul>
                    </div>

                    {/* Claim Button */}
                    <button
                        onClick={handleClaim}
                        disabled={isClaiming || timeLeft === 0 || remaining === 0}
                        className={`w-full py-3 sm:py-4 rounded-xl transition-all text-sm sm:text-base ${
                            isClaiming
                                ? 'bg-green-500 text-white'
                                : timeLeft === 0 || remaining === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 active:scale-95'
                        }`}
                    >
                        {isClaiming ? (
                            <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                발급 중...
              </span>
                        ) : timeLeft === 0 ? (
                            '쿠폰 발급 종료'
                        ) : remaining === 0 ? (
                            '쿠폰 소진'
                        ) : (
                            '쿠폰 받기'
                        )}
                    </button>

                    {/* Warning */}
                    <div className="mt-3 sm:mt-4 text-xs text-gray-500 text-center">
                        ⚠️ 쿠폰은 발급 후 취소가 불가능합니다
                    </div>
                </div>
            </div>
        </div>
    );
}
