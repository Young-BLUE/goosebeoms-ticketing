import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { preparePayment, confirmPayment, getBooking } from '../api/bookings';
import type { BookingResponse, PaymentPrepareResponse } from '../api/types';
import { Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

// 토스 SDK v2의 widgets 반환 타입 — export 안 되어 있어 utility로 추출
type TossPayments = Awaited<ReturnType<typeof loadTossPayments>>;
type TossWidgets = Awaited<ReturnType<TossPayments['widgets']>>;

export function PaymentPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [prepare, setPrepare] = useState<PaymentPrepareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetsRef = useRef<TossWidgets | null>(null);
  const mountedRef = useRef(false);  // StrictMode 중복 mount 가드 (위젯 mount용)
  const preparedRef = useRef(false); // StrictMode 중복 prepare 가드 (POST 멱등성 X)

  // 결제 콜백에서 돌아온 경우 (토스가 successUrl로 리다이렉트)
  const searchParams = new URLSearchParams(location.search);
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const isCallback = !!(paymentKey && orderId && amount);

  // 콜백 — 백엔드에 결제 confirm 요청
  useEffect(() => {
    if (!bookingId || !isCallback) return;
    confirmPayment(Number(bookingId), {
      paymentKey: paymentKey!,
      orderId: orderId!,
      amount: Number(amount),
    })
      .then((b) =>
        navigate(`/booking/${bookingId}/confirmation`, { state: { booking: b } }),
      )
      .catch((err) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg ?? '결제 확인에 실패했습니다');
        setLoading(false);
      });
  }, [bookingId, isCallback, paymentKey, orderId, amount, navigate]);

  // 일반 진입 — booking + prepare 병렬 로드.
  // preparePayment 는 POST 라 멱등하지 않으므로 ref 가드로 StrictMode 두 번 실행을 방지.
  // cleanup 의 cancelled flag 를 쓰면 ref 가드와 충돌해서 (첫 closure 만 cancel=true 가 되고
  // 두 번째 effect 는 ref 로 막혀 새 cancelled 가 안 생김) state 업데이트가 영원히 누락됨.
  useEffect(() => {
    if (!bookingId || isCallback || preparedRef.current) return;
    preparedRef.current = true;

    Promise.all([
      getBooking(Number(bookingId)),
      preparePayment(Number(bookingId)),
    ])
      .then(([b, p]) => {
        setBooking(b);
        setPrepare(p);
      })
      .catch((err) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg ?? '결제 정보를 불러오는데 실패했습니다');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bookingId, isCallback]);

  // 토스 결제위젯 mount — prepare/booking 준비 후 한 번만 실행.
  // mountedRef 가드가 있으므로 cancelled flag/cleanup 은 사용하지 않는다 (위 effect 와 같은 이유).
  useEffect(() => {
    if (!prepare || !booking || mountedRef.current) return;
    mountedRef.current = true;

    (async () => {
      try {
        const tossPayments = await loadTossPayments(prepare.clientKey);
        // customerKey 는 사용자 식별자. email로 충분.
        const widgets = tossPayments.widgets({ customerKey: prepare.customerEmail });
        widgetsRef.current = widgets;

        await widgets.setAmount({ currency: 'KRW', value: prepare.amount });

        // variantKey 는 토스 결제위젯 어드민에서 만든 커스텀 디자인 ID.
        // 우리 상점은 별도 디자인을 만들지 않으므로 생략 → 토스가 내부 기본 UI 사용.
        await Promise.all([
          widgets.renderPaymentMethods({ selector: '#payment-method' }),
          widgets.renderAgreement({ selector: '#agreement' }),
        ]);

        setWidgetReady(true);
      } catch (err) {
        const msg = (err as { message?: string })?.message;
        setError(msg ?? '결제 위젯 로딩에 실패했습니다');
      }
    })();
  }, [prepare, booking]);

  const handlePay = async () => {
    if (!widgetsRef.current || !booking || !prepare || !bookingId) return;
    setPaying(true);
    setError(null);
    try {
      await widgetsRef.current.requestPayment({
        orderId: prepare.orderId,
        orderName: booking.showTitle,
        successUrl: `${window.location.origin}/booking/${bookingId}/payment?`,
        failUrl: `${window.location.origin}/booking/${bookingId}/payment`,
        customerEmail: prepare.customerEmail,
        customerName: prepare.customerName,
      });
      // 정상 흐름에선 successUrl 로 리다이렉트되어 여기 도달 안 함
    } catch (err) {
      const msg = (err as { message?: string })?.message;
      setError(msg ?? '결제 요청에 실패했습니다');
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

  if (!booking || !prepare) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="text-red-500 mb-4">{error ?? '결제 정보를 찾을 수 없습니다'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-brand text-white rounded-lg"
          >
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

          {/* 토스 결제위젯 mount 영역 */}
          <div id="payment-method" className="mb-2" />
          <div id="agreement" className="mb-4" />

          {!widgetReady && !error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              결제 위젯을 불러오는 중...
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={!widgetReady || paying}
            className="w-full py-4 bg-gradient-to-r from-brand to-accent text-white rounded-xl hover:from-brand-hover hover:to-accent-hover transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {paying ? '처리 중...' : `${booking.finalPrice.toLocaleString()}원 결제하기`}
          </button>
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
