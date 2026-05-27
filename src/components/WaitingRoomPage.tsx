import { useState, useEffect, useRef } from 'react';
import { Clock, Users, Loader2, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import {
  enterQueue,
  subscribeQueue,
  leaveQueue,
  seedQueueGhosts,
  clearQueueGhosts,
} from '../api/queue';
import type { QueueStatusResponse } from '../api/types';

interface WaitingRoomPageProps {
  scheduleId: number;
  onComplete: (queueToken: string) => void;
  onLeave: () => void;
}

function formatEta(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `약 ${seconds}초`;
  return `약 ${Math.ceil(seconds / 60)}분`;
}

// 진행도(%) — (전체 - 내 위치) / 전체. totalWaiting/position 미정이면 0
function calcProgress(s: QueueStatusResponse | null): number {
  if (!s || !s.totalWaiting || !s.position) return 0;
  const pct = ((s.totalWaiting - s.position) / s.totalWaiting) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function WaitingRoomPage({ scheduleId, onComplete, onLeave }: WaitingRoomPageProps) {
  const [status, setStatus] = useState<QueueStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [seedBusy, setSeedBusy] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
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

  // 🧪 시연 모드 — dev 환경에서만 노출. 가짜 대기자를 큐 앞쪽에 추가/정리.
  const handleSeed = async (count: number) => {
    setSeedBusy(true);
    setSeedMsg(null);
    try {
      const r = await seedQueueGhosts(scheduleId, count);
      setSeedMsg(`가짜 ${r.seeded}명 추가 (전체 ${r.totalWaiting}명)`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSeedMsg(e?.response?.data?.message ?? '시드 실패 (백엔드 dev 프로파일?)');
    } finally {
      setSeedBusy(false);
    }
  };
  const handleClearSeed = async () => {
    setSeedBusy(true);
    setSeedMsg(null);
    try {
      const r = await clearQueueGhosts(scheduleId);
      setSeedMsg(`가짜 ${r.removedGhosts}명 정리 (전체 ${r.totalWaiting}명)`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSeedMsg(e?.response?.data?.message ?? '정리 실패');
    } finally {
      setSeedBusy(false);
    }
  };

  const progress = calcProgress(status);

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

              {/* 대기 순번 + 전체 인원 */}
              <div className="mb-6 sm:mb-8">
                <div className="inline-block bg-gradient-to-r from-brand-soft to-accent-soft rounded-2xl px-8 py-6 sm:px-12 sm:py-8">
                  <div className="text-sm sm:text-base text-gray-600 mb-2">현재 대기 순번</div>
                  {status ? (
                    <div className="text-5xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent tabular-nums">
                      {status.position ?? '-'}
                    </div>
                  ) : (
                    <div className="text-5xl sm:text-6xl text-gray-400">—</div>
                  )}
                  <div className="text-xs sm:text-sm text-gray-500 mt-2 tabular-nums">
                    {status?.totalWaiting != null
                      ? `${status.position ?? '-'} / ${status.totalWaiting}명 대기 중`
                      : '번째 대기 중'}
                  </div>
                </div>
              </div>

              {/* 진행도 바 — (전체 - 내 위치) / 전체 */}
              <div className="max-w-md mx-auto mb-8 sm:mb-10">
                <div className="flex justify-between text-xs text-gray-500 mb-2 tabular-nums">
                  <span>
                    내 앞 <strong className="text-gray-700">{status?.ahead ?? '—'}</strong>명 ·
                    뒤 <strong className="text-gray-700">{status?.behind ?? '—'}</strong>명
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand to-accent transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
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
                    {formatEta(status?.etaSeconds)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-accent-soft to-accent-soft rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    <span className="text-sm sm:text-base text-accent-soft-fg">전체 대기</span>
                  </div>
                  <div className="text-2xl sm:text-3xl text-accent tabular-nums">
                    {status?.totalWaiting != null ? `${status.totalWaiting}명` : '—'}
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

              {/* 🧪 시연 모드 — Vite dev 환경 전용. 백엔드 dev 프로파일에서만 작동. */}
              {import.meta.env.DEV && (
                <div className="mt-8 p-4 border border-dashed border-gray-300 rounded-xl text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500 tracking-wide">시연 모드 (DEV)</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    가짜 대기자를 큐 앞쪽에 추가해 rank 줄어드는 모습을 시연합니다.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[100, 500, 1000].map((n) => (
                      <button
                        key={n}
                        onClick={() => handleSeed(n)}
                        disabled={seedBusy}
                        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                      >
                        +{n}명
                      </button>
                    ))}
                    <button
                      onClick={handleClearSeed}
                      disabled={seedBusy}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                    >
                      정리
                    </button>
                  </div>
                  {seedMsg && (
                    <p className="mt-2 text-xs text-gray-600">{seedMsg}</p>
                  )}
                </div>
              )}
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
