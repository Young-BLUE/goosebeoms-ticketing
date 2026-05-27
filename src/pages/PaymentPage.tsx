import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { preparePayment, confirmPayment, getBooking } from '../api/bookings';
import type { BookingResponse } from '../api/types';
import { Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

export function PaymentPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 결제 콜백에서 돌아온 경우 처리
  const searchParams = new URLSearchParams(location.search);
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!bookingId) return;

    // 토스 결제 완료 후 리다이렉트된 경우
    if (paymentKey && orderId && amount) {
      confirmPayment(Number(bookingId), {
        paymentKey,
        orderId,
        amount: Number(amount),
      })
        .then((b) => navigate(`/booking/${bookingId}/confirmation`, { state: { booking: b } }))
        .catch((err) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setError(msg ?? '결제 확인에 실패했습니다');
          setLoading(false);
        });
      return;
    }

    getBooking(Number(bookingId))
      .then(setBooking)
      .catch(() => setError('예매 정보를 불러오는데 실패했습니다'))
      .finally(() => setLoading(false));
  }, [bookingId, paymentKey, orderId, amount, navigate]);

  const handlePay = async (method: 'CARD' | 'VIRTUAL_ACCOUNT') => {
    if (!bookingId || !booking) return;
    setPaying(true);
    setError(null);
    try {
      const prepare = await preparePayment(Number(bookingId), method);
      const tossPayments = await loadTossPayments(prepare.clientKey);
      const payment = tossPayments.payment({ customerKey: prepare.customerEmail });

      const common = {
        amount: { currency: 'KRW', value: prepare.amount },
        orderId: prepare.orderId,
        orderName: booking.showTitle,
        customerEmail: prepare.customerEmail,
        customerName: prepare.customerName,
        successUrl: `${window.location.origin}/booking/${bookingId}/payment?`,
        failUrl: `${window.location.origin}/booking/${bookingId}/payment`,
      };

      // method 리터럴을 정적으로 좁혀야 토스 SDK requestPayment 의 오버로드가 매칭됨
      if (method === 'CARD') {
        await payment.requestPayment({ method: 'CARD', ...common });
      } else {
        await payment.requestPayment({ method: 'VIRTUAL_ACCOUNT', ...common });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? '결제 요청에 실패했습니다');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="text-red-500 mb-4">{error ?? '예매 정보를 찾을 수 없습니다'}</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-brand text-white rounded-lg">
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-4">
          <h1 className="text-gray-900 mb-6 text-xl sm:text-2xl">결제하기</h1>

          {/* 예매 요약 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
            <div className="font-medium text-gray-900">{booking.showTitle}</div>
            <div className="text-gray-600">{booking.venue}</div>
            <div className="text-gray-600">
              {dayjs(booking.scheduledAt).format('YYYY년 MM월 DD일 HH:mm')}
            </div>
            <div className="text-gray-600">
              좌석:{' '}
              {booking.seats.map((s) => `${s.rowLabel}${s.number}`).join(', ')} ({booking.seats.length}석)
            </div>
          </div>

          {/* 가격 */}
          <div className="mb-6 space-y-2 text-sm border-t pt-4">
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
            <div className="flex justify-between text-base font-medium border-t pt-2">
              <span className="text-gray-900">최종 결제 금액</span>
              <span className="text-brand">{booking.finalPrice.toLocaleString()}원</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 결제 수단 */}
          <div className="space-y-3">
            <button
              onClick={() => handlePay('CARD')}
              disabled={paying}
              className="w-full py-4 bg-gradient-to-r from-brand to-accent text-white rounded-xl hover:from-brand-hover hover:to-accent-hover transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              신용카드로 결제
            </button>
            <button
              onClick={() => handlePay('VIRTUAL_ACCOUNT')}
              disabled={paying}
              className="w-full py-4 border-2 border-brand text-brand rounded-xl hover:bg-brand-soft transition-all disabled:opacity-60"
            >
              가상계좌로 결제
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          이전으로 돌아가기
        </button>
      </div>
    </div>
  );
}
