import { useState } from 'react';
import { Monitor, XCircle, CheckCircle2, User as UserIcon } from 'lucide-react';

interface SeatSelectionProps {
    onConfirm: (seats: string[], showTime: string, showTitle: string) => void;
}

type SeatStatus = 'available' | 'selected' | 'reserved';

interface Seat {
    id: string;
    row: string;
    number: number;
    status: SeatStatus;
}

export function SeatSelection({ onConfirm }: SeatSelectionProps) {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 12;

    const [seats] = useState<Seat[]>(() => {
        const allSeats: Seat[] = [];
        const reservedSeats = new Set([
            'A-3', 'A-4', 'B-5', 'B-6', 'B-7', 'C-8', 'D-4', 'D-5',
            'E-9', 'E-10', 'F-2', 'F-3', 'G-6', 'G-7', 'H-8'
        ]);

        rows.forEach(row => {
            for (let i = 1; i <= seatsPerRow; i++) {
                allSeats.push({
                    id: `${row}-${i}`,
                    row,
                    number: i,
                    status: reservedSeats.has(`${row}-${i}`) ? 'reserved' : 'available'
                });
            }
        });

        return allSeats;
    });

    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [showTime, setShowTime] = useState('19:00');
    const showTitle = '뮤지컬 <해밀턴>';

    const handleSeatClick = (seatId: string, status: SeatStatus) => {
        if (status === 'reserved') return;

        setSelectedSeats(prev => {
            if (prev.includes(seatId)) {
                return prev.filter(id => id !== seatId);
            } else if (prev.length < 4) {
                return [...prev, seatId];
            }
            return prev;
        });
    };

    const getSeatStatus = (seatId: string): SeatStatus => {
        const seat = seats.find(s => s.id === seatId);
        if (selectedSeats.includes(seatId)) return 'selected';
        return seat?.status || 'available';
    };

    const totalPrice = selectedSeats.length * 50000;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-gray-900 mb-2">좌석 선택</h1>
                    <p className="text-gray-600">{showTitle} - {showTime}</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            {/* Screen */}
                            <div className="mb-8">
                                <div className="bg-gradient-to-b from-gray-800 to-gray-600 rounded-t-3xl py-3 text-center text-white text-sm mb-2">
                                    <Monitor className="w-6 h-6 mx-auto mb-1" />
                                    STAGE
                                </div>
                                <div className="h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                            </div>

                            {/* Seats Grid */}
                            <div className="space-y-3 mb-6">
                                {rows.map(row => (
                                    <div key={row} className="flex items-center justify-center gap-2">
                                        <div className="w-8 text-center text-gray-600">{row}</div>
                                        <div className="flex gap-2">
                                            {Array.from({ length: seatsPerRow }).map((_, idx) => {
                                                const seatNumber = idx + 1;
                                                const seatId = `${row}-${seatNumber}`;
                                                const status = getSeatStatus(seatId);

                                                return (
                                                    <button
                                                        key={seatId}
                                                        onClick={() => handleSeatClick(seatId, status)}
                                                        disabled={status === 'reserved'}
                                                        className={`w-8 h-8 rounded-lg text-xs transition-all ${
                                                            status === 'available'
                                                                ? 'bg-gray-200 hover:bg-blue-300 hover:scale-110'
                                                                : status === 'selected'
                                                                    ? 'bg-purple-600 text-white scale-110 shadow-lg'
                                                                    : 'bg-gray-400 cursor-not-allowed opacity-50'
                                                        }`}
                                                        title={seatId}
                                                    >
                                                        {status === 'selected' ? '✓' : seatNumber}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gray-200 rounded-lg" />
                                    <span className="text-sm text-gray-600">선택가능</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-purple-600 rounded-lg" />
                                    <span className="text-sm text-gray-600">선택됨</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gray-400 rounded-lg opacity-50" />
                                    <span className="text-sm text-gray-600">예약됨</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                            <h3 className="text-gray-900 mb-4">예매 정보</h3>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">공연명</label>
                                    <div className="text-gray-900">{showTitle}</div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">관람 시간</label>
                                    <select
                                        value={showTime}
                                        onChange={(e) => setShowTime(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="14:00">14:00</option>
                                        <option value="19:00">19:00</option>
                                        <option value="20:30">20:30</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">선택한 좌석</label>
                                    {selectedSeats.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSeats.map(seat => (
                                                <span
                                                    key={seat}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm"
                                                >
                          {seat}
                                                    <XCircle
                                                        className="w-4 h-4 cursor-pointer hover:text-purple-900"
                                                        onClick={() => handleSeatClick(seat, 'selected')}
                                                    />
                        </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm">좌석을 선택해주세요 (최대 4석)</p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-600">좌석 ({selectedSeats.length}석)</span>
                                    <span className="text-gray-900">{totalPrice.toLocaleString()}원</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-600">할인 (30%)</span>
                                    <span className="text-red-500">-{(totalPrice * 0.3).toLocaleString()}원</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                    <span className="text-gray-900">최종 결제금액</span>
                                    <span className="text-purple-600">{(totalPrice * 0.7).toLocaleString()}원</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onConfirm(selectedSeats, showTime, showTitle)}
                                disabled={selectedSeats.length === 0}
                                className={`w-full py-4 rounded-xl transition-all ${
                                    selectedSeats.length > 0
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 active:scale-95'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {selectedSeats.length > 0 ? (
                                    <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    예매하기
                  </span>
                                ) : (
                                    '좌석을 선택하세요'
                                )}
                            </button>

                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-xs text-yellow-800">
                                    좌석은 최대 4개까지 선택 가능합니다
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
