import { useState, useEffect } from 'react';
import { Users, Clock, TrendingDown } from 'lucide-react';

interface WaitingPageProps {
    onComplete: () => void;
}

export function WaitingPage({ onComplete }: WaitingPageProps) {
    const [queuePosition, setQueuePosition] = useState(847);
    const [estimatedTime, setEstimatedTime] = useState(125);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setQueuePosition(prev => {
                const next = Math.max(0, prev - Math.floor(Math.random() * 50) - 10);
                if (next === 0) {
                    setTimeout(() => onComplete(), 1000);
                }
                return next;
            });

            setEstimatedTime(prev => Math.max(0, prev - 5));
            setProgress(prev => Math.min(100, prev + 2));
        }, 200);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4 animate-pulse">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-gray-900 mb-2">예매 대기 중</h2>
                        <p className="text-gray-600">잠시만 기다려주세요</p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                            <div className="text-center mb-4">
                                <div className="text-gray-600 mb-2">현재 대기 순번</div>
                                <div className="text-purple-600 transition-all duration-300">
                                    {queuePosition.toLocaleString()}번
                                </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <Clock className="w-5 h-5" />
                                    <span className="text-sm">예상 대기 시간</span>
                                </div>
                                <div className="text-gray-900">
                                    {Math.floor(estimatedTime / 60)}분 {estimatedTime % 60}초
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <TrendingDown className="w-5 h-5" />
                                    <span className="text-sm">처리 속도</span>
                                </div>
                                <div className="text-green-600">빠름</div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-900">
                                💡 <strong>안내:</strong> 페이지를 새로고침하면 대기열에서 이탈될 수 있습니다.
                                화면을 유지해주세요.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span>서버 연결 상태: 정상</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <span>쿠폰 적용 완료</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>잠시 후 좌석 선택 페이지로 이동합니다</p>
                </div>
            </div>
        </div>
    );
}
