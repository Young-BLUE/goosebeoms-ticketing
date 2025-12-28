import {useState, useEffect, useRef} from 'react';
import { Ticket, Clock, Gift, Zap } from 'lucide-react';
import dayjs from "dayjs";

interface CouponPageProps {
    onCouponClaim: (couponCode: string) => void;
}

export function CouponPage({ onCouponClaim }: CouponPageProps) {
    const [coupons, setCoupons] = useState([
        { id: 1, name: '얼리버드 30% 할인', discount: '30%', remaining: 50, total: 100, time: 300 },
        { id: 2, name: 'VIP 좌석 20% 할인', discount: '20%', remaining: 30, total: 50, time: 180 },
        { id: 3, name: '평일 특가 15% 할인', discount: '15%', remaining: 80, total: 200, time: 600 },
    ]);

    const [claimed, setClaimed] = useState<number | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCoupons(prev => prev.map(coupon => ({
                ...coupon,
                remaining: Math.max(0, coupon.remaining - Math.floor(Math.random() * 3))
            })));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleClaim = (couponId: number, couponName: string) => {
        setClaimed(couponId);
        const couponCode = `COUPON${couponId}${dayjs().format("YYYYMMDD")}`;

        setTimeout(() => {
            onCouponClaim(couponCode);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4">
                        <Gift className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-purple-900 mb-2">선착순 쿠폰 발급</h1>
                    <p className="text-gray-600">지금 바로 쿠폰을 받고 특별한 혜택을 누리세요!</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {coupons.map((coupon) => {
                        const percentage = (coupon.remaining / coupon.total) * 100;
                        const isLowStock = percentage < 30;
                        const isClaimed = claimed === coupon.id;

                        return (
                            <div
                                key={coupon.id}
                                className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${
                                    isClaimed ? 'ring-4 ring-purple-500 scale-105' : 'hover:shadow-xl'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-gray-900 mb-1">{coupon.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-purple-600">{coupon.discount}</span>
                                            {isLowStock && (
                                                <span className="flex items-center gap-1 text-red-500 text-sm">
                          <Zap className="w-4 h-4" />
                          마감임박
                        </span>
                                            )}
                                        </div>
                                    </div>
                                    <Ticket className="w-10 h-10 text-purple-200" />
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                        <span>남은 쿠폰</span>
                                        <span>{coupon.remaining}/{coupon.total}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${
                                                isLowStock ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                    <Clock className="w-4 h-4" />
                                    <span>{Math.floor(coupon.time / 60)}분 {coupon.time % 60}초 남음</span>
                                </div>

                                <button
                                    onClick={() => handleClaim(coupon.id, coupon.name)}
                                    disabled={coupon.remaining === 0 || claimed !== null}
                                    className={`w-full py-3 rounded-xl transition-all ${
                                        coupon.remaining === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : isClaimed
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 active:scale-95'
                                    }`}
                                >
                                    {coupon.remaining === 0
                                        ? '품절'
                                        : isClaimed
                                            ? '✓ 발급완료'
                                            : '쿠폰 받기'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 bg-white/70 backdrop-blur rounded-xl p-6">
                    <h3 className="text-gray-900 mb-3">유의사항</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>• 쿠폰은 1인 1회 한정으로 발급됩니다.</li>
                        <li>• 선착순 마감 시 쿠폰 발급이 종료됩니다.</li>
                        <li>• 발급받은 쿠폰은 예매 시 자동으로 적용됩니다.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
