import { useState, useEffect } from 'react';
import { Clock, Users, Loader2, CheckCircle2 } from 'lucide-react';
import type {Show} from "../models/ticket-model.ts";

interface WaitingRoomPageProps {
    show: Show;
    onComplete: () => void;
}

export function WaitingRoomPage({ show, onComplete }: WaitingRoomPageProps) {
    const [waitingNumber, setWaitingNumber] = useState(Math.floor(Math.random() * 150) + 50);
    const [estimatedTime, setEstimatedTime] = useState(Math.floor(waitingNumber / 10));
    const [isComplete, setIsComplete] = useState(false);
    const [currentUsers, setCurrentUsers] = useState(Math.floor(Math.random() * 500) + 200);

    useEffect(() => {
        if (waitingNumber <= 0) {
            setIsComplete(true);
            const timer = setTimeout(() => {
                onComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }

        const interval = setInterval(() => {
            setWaitingNumber((prev) => {
                const decrease = Math.floor(Math.random() * 5) + 1;
                const newValue = Math.max(0, prev - decrease);
                return newValue;
            });

            setEstimatedTime((prev) => Math.max(0, prev - 1));

            setCurrentUsers((prev) => {
                const change = Math.floor(Math.random() * 20) - 10;
                return Math.max(100, prev + change);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [waitingNumber, onComplete]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* 메인 카드 */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
                    {!isComplete ? (
                        <>
                            {/* 로딩 아이콘 */}
                            <div className="mb-8">
                                <div className="relative inline-flex">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                    <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-6">
                                        <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-white animate-spin" />
                                    </div>
                                </div>
                            </div>

                            {/* 타이틀 */}
                            <h1 className="text-gray-900 mb-3 text-2xl sm:text-3xl">잠시만 기다려주세요</h1>
                            <p className="text-gray-600 mb-8 sm:mb-12 text-sm sm:text-base">
                                현재 많은 분들이 예매를 진행 중입니다
                            </p>

                            {/* 대기 번호 */}
                            <div className="mb-8 sm:mb-12">
                                <div className="inline-block bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl px-8 py-6 sm:px-12 sm:py-8">
                                    <div className="text-sm sm:text-base text-gray-600 mb-2">현재 대기 순번</div>
                                    <div className="text-5xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 tabular-nums">
                                        {waitingNumber}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-500 mt-2">명 대기 중</div>
                                </div>
                            </div>

                            {/* 정보 카드들 */}
                            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                                {/* 예상 대기 시간 */}
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-6">
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                                        <span className="text-sm sm:text-base text-purple-900">예상 대기 시간</span>
                                    </div>
                                    <div className="text-2xl sm:text-3xl text-purple-600 tabular-nums">
                                        {Math.floor(estimatedTime / 60)}:{(estimatedTime % 60).toString().padStart(2, '0')}
                                    </div>
                                    <div className="text-xs sm:text-sm text-purple-700 mt-1">분:초</div>
                                </div>

                                {/* 현재 접속자 */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6">
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                        <span className="text-sm sm:text-base text-blue-900">현재 접속자</span>
                                    </div>
                                    <div className="text-2xl sm:text-3xl text-blue-600 tabular-nums">
                                        {currentUsers.toLocaleString()}
                                    </div>
                                    <div className="text-xs sm:text-sm text-blue-700 mt-1">명</div>
                                </div>
                            </div>

                            {/* 공연 정보 */}
                            <div className="border-t border-gray-200 pt-6 sm:pt-8">
                                <div className="flex items-center gap-4 justify-center">
                                    <img
                                        src={show.image}
                                        alt={show.title}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-lg"
                                    />
                                    <div className="text-left">
                                        <div className="text-gray-900 text-base sm:text-lg mb-1">{show.title}</div>
                                        <div className="text-xs sm:text-sm text-gray-600">{show.venue}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 안내 메시지 */}
                            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <p className="text-xs sm:text-sm text-yellow-800">
                                    <strong>안내:</strong> 페이지를 새로고침하거나 닫으면 대기 순번이 초기화됩니다.
                                </p>
                            </div>

                            {/* 프로그레스 바 */}
                            <div className="mt-6 sm:mt-8">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${Math.max(5, 100 - (waitingNumber / 2))}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* 완료 화면 */}
                            <div className="mb-8">
                                <div className="relative inline-flex">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-50"></div>
                                    <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-6">
                                        <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                                    </div>
                                </div>
                            </div>

                            <h1 className="text-gray-900 mb-3 text-2xl sm:text-3xl">입장 준비 완료!</h1>
                            <p className="text-gray-600 mb-8 text-sm sm:text-base">
                                좌석 선택 화면으로 이동합니다...
                            </p>

                            <div className="inline-block bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl px-8 py-6">
                                <div className="text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                                    ✓
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 하단 정보 */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        티켓 오픈 시간에는 대기 시간이 길어질 수 있습니다
                    </p>
                </div>
            </div>
        </div>
    );
}
