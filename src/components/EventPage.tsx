import { useState } from 'react';
import { ArrowLeft, Gift, Tag, Users, Loader2, CheckCircle } from 'lucide-react';
import type { CouponResponse } from '../api/types';
import type { AuthUser } from '../contexts/AppContexts';
import { issueCoupon } from '../api/coupons';
import dayjs from 'dayjs';

interface EventPageProps {
  coupons: CouponResponse[];
  user: AuthUser | null;
  onBack: () => void;
  onLoginClick: () => void;
}

export function EventPage({ coupons, user, onBack, onLoginClick }: EventPageProps) {
  const [issuingId, setIssuingId] = useState<number | null>(null);
  const [issuedIds, setIssuedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleIssue = async (couponId: number) => {
    if (!user) {
      onLoginClick();
      return;
    }
    setIssuingId(couponId);
    setError(null);
    try {
      await issueCoupon(couponId);
      setIssuedIds((prev) => new Set([...prev, couponId]));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '쿠폰 발급에 실패했습니다');
    } finally {
      setIssuingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
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

      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
            <Gift className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-white mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl">
            쿠폰 & 혜택
          </h1>
          <p className="text-purple-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg px-4">
            다양한 할인 쿠폰을 받아보세요
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {coupons.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center">
            <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-gray-900 mb-2 text-base sm:text-lg">현재 진행 중인 쿠폰이 없습니다</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {coupons.map((coupon) => {
              const issued = issuedIds.has(coupon.id);
              const soldOut = coupon.remainingCount === 0;
              const isLoading = issuingId === coupon.id;
              const ratio = coupon.maxCount > 0 ? coupon.remainingCount / coupon.maxCount : 0;
              const isLowStock = ratio < 0.3 && !soldOut;

              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                >
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs">
                        {coupon.discountType === 'FIXED' ? (
                          <Tag className="w-3.5 h-3.5" />
                        ) : (
                          <Gift className="w-3.5 h-3.5" />
                        )}
                        {coupon.discountType === 'FIXED' ? '정액 할인' : '정률 할인'}
                      </span>
                      {soldOut && (
                        <span className="bg-white/20 text-xs px-2 py-1 rounded-full">소진</span>
                      )}
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold mt-3">
                      {coupon.discountType === 'FIXED'
                        ? `${coupon.discountValue.toLocaleString()}원`
                        : `${coupon.discountValue}%`}
                    </div>
                    <div className="text-purple-100 text-sm mt-1">{coupon.name}</div>
                  </div>

                  <div className="p-5">
                    {/* 잔여 수량 */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Users className="w-3.5 h-3.5" />
                          남은 수량
                        </span>
                        <span className={isLowStock ? 'text-red-500' : 'text-gray-900'}>
                          {coupon.remainingCount.toLocaleString()} / {coupon.maxCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isLowStock ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                          }`}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 유효기간 */}
                    <div className="text-xs text-gray-500 mb-4">
                      유효기간: {dayjs(coupon.validFrom).format('YY.MM.DD')} ~{' '}
                      {dayjs(coupon.validUntil).format('YY.MM.DD')}
                    </div>

                    <button
                      onClick={() => handleIssue(coupon.id)}
                      disabled={issued || soldOut || isLoading}
                      className={`w-full py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        issued
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : soldOut
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : issued ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> 발급 완료
                        </>
                      ) : soldOut ? (
                        '쿠폰 소진'
                      ) : !user ? (
                        '로그인 후 발급'
                      ) : (
                        '쿠폰 받기'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-blue-900 mb-3">쿠폰 안내</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• 쿠폰은 1인 1회 발급이 원칙입니다</li>
            <li>• 발급받은 쿠폰은 좌석 선택 시 적용할 수 있습니다</li>
            <li>• 쿠폰 유효기간이 지나면 자동으로 소멸됩니다</li>
            <li>• 로그인 후 쿠폰을 발급받을 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
