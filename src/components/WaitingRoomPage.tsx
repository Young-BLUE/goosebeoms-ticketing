import { useState, useEffect, useRef } from 'react';
import { Clock, Users, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { enterQueue, subscribeQueue, leaveQueue } from '../api/queue';
import type { QueueStatusResponse } from '../api/types';

interface WaitingRoomPageProps {
  scheduleId: number;
  onComplete: (queueToken: string) => void;
  onLeave: () => void;
}

export function WaitingRoomPage({ scheduleId, onComplete, onLeave }: WaitingRoomPageProps) {
  const [status, setStatus] = useState<QueueStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const initial = await enterQueue(scheduleId);
        if (cancelled) return;

        if ((initial.state === 'ACTIVE' || initial.state === 'NONE') && initial.token) {
          setIsActive(true);
          setTimeout(() => onComplete(initial.token!), 1500);
          return;
        }

        setStatus(initial);

        const es = subscribeQueue(
          scheduleId,
          (s) => {
            if (cancelled) return;
            setStatus(s);
            if ((s.state === 'ACTIVE' || s.state === 'NONE') && s.token) {
              setIsActive(true);
              es.close();
              setTimeout(() => onComplete(s.token!), 1500);
            }
          },
          () => {
            if (!cancelled) setError('서버 연결이 끊겼습니다. 페이지를 새로고침해주세요.');
          },
        );
        esRef.current = es;
      } catch (err: unknown) {
        if (!cancelled) {
          const e = err as { response?: { status?: number; data?: { message?: string } } };
          const status = e?.response?.status;
          const msg = e?.response?.data?.message;
          setError(msg ?? `대기열 진입 실패 (status: ${status ?? 'network'}). 콘솔 확인.`);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      esRef.current?.close();
    };
  }, [scheduleId, onComplete]);

  const handleLeave = async () => {
    esRef.current?.close();
    try {
      await leaveQueue(scheduleId);
    } catch {
      // 무시
    }
    onLeave();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-soft via-accent-soft to-brand-soft flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-gray-900 mb-3">연결 오류</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onLeave}
            className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-soft via-accent-soft to-brand-soft flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
          {!isActive ? (
            <>
              {/* 로딩 아이콘 */}
              <div className="mb-8">
                <div className="relative inline-flex">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand to-accent rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-r from-brand to-accent rounded-full p-6">
                    <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-white animate-spin" />
                  </div>
                </div>
              </div>

              <h1 className="text-gray-900 mb-3 text-2xl sm:text-3xl">잠시만 기다려주세요</h1>
              <p className="text-gray-600 mb-8 sm:mb-12 text-sm sm:text-base">
                현재 많은 분들이 예매를 진행 중입니다
              </p>

              {/* 대기 순번 */}
              <div className="mb-8 sm:mb-12">
                <div className="inline-block bg-gradient-to-r from-brand-soft to-accent-soft rounded-2xl px-8 py-6 sm:px-12 sm:py-8">
                  <div className="text-sm sm:text-base text-gray-600 mb-2">현재 대기 순번</div>
                  {status ? (
                    <div className="text-5xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent tabular-nums">
                      {status.position ?? '-'}
                    </div>
                  ) : (
                    <div className="text-5xl sm:text-6xl text-gray-400">—</div>
                  )}
                  <div className="text-xs sm:text-sm text-gray-500 mt-2">번째 대기 중</div>
                </div>
              </div>

              {/* 정보 카드 */}
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                <div className="bg-gradient-to-br from-brand-soft to-brand-soft rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                    <span className="text-sm sm:text-base text-brand-soft-fg">예상 대기 시간</span>
                  </div>
                  <div className="text-2xl sm:text-3xl text-brand">
                    {status?.etaSeconds != null ? `약 ${Math.ceil(status.etaSeconds / 60)}분` : '—'}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-accent-soft to-accent-soft rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    <span className="text-sm sm:text-base text-accent-soft-fg">상태</span>
                  </div>
                  <div className="text-lg sm:text-xl text-accent">
                    {status?.state === 'WAITING' ? '대기 중' : '연결 중...'}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <strong>안내:</strong> 페이지를 새로고침하거나 닫으면 대기 순번이 초기화됩니다.
                </p>
              </div>

              <button
                onClick={handleLeave}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                대기열 나가기
              </button>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="relative inline-flex">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-50" />
                  <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-6">
                    <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-gray-900 mb-3 text-2xl sm:text-3xl">입장 준비 완료!</h1>
              <p className="text-gray-600 mb-8 text-sm sm:text-base">
                좌석 선택 화면으로 이동합니다...
              </p>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            티켓 오픈 시간에는 대기 시간이 길어질 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
