import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, X } from 'lucide-react';
import type {Show} from "../models/ticket-model.ts";

interface SeatSelectionPageProps {
    show: Show;
    onBack: () => void;
    onConfirm: (bookingData: {
        showId: number;
        showTitle: string;
        showImage: string;
        date: Date|null;
        time: string;
        seats: string[];
        totalPrice: number;
    }) => void;
}

interface Seat {
    id: string;
    row: string;
    number: number;
    type: 'VIP' | 'R' | 'S';
    price: number;
    status: 'available' | 'selected' | 'occupied';
}

export function SeatSelectionPage({ show, onBack, onConfirm }: SeatSelectionPageProps) {
    const [selectedDate, setSelectedDate] = useState<string>("2025-12-25");
    const [selectedTime, setSelectedTime] = useState('19:00');
    const [seats, setSeats] = useState<Seat[]>(generateSeats());

    function generateSeats(): Seat[] {
        const seatList: Seat[] = [];

        // VIP 석 (A-B열, 1-12번)
        for (const row of ['A', 'B']) {
            for (let num = 1; num <= 12; num++) {
                seatList.push({
                    id: `${row}${num}`,
                    row,
                    number: num,
                    type: 'VIP',
                    price: 150000,
                    status: Math.random() > 0.7 ? 'occupied' : 'available',
                });
            }
        }

        // R석 (C-F열, 1-14번)
        for (const row of ['C', 'D', 'E', 'F']) {
            for (let num = 1; num <= 14; num++) {
                seatList.push({
                    id: `${row}${num}`,
                    row,
                    number: num,
                    type: 'R',
                    price: 120000,
                    status: Math.random() > 0.6 ? 'occupied' : 'available',
                });
            }
        }

        // S석 (G-J열, 1-16번)
        for (const row of ['G', 'H', 'I', 'J']) {
            for (let num = 1; num <= 16; num++) {
                seatList.push({
                    id: `${row}${num}`,
                    row,
                    number: num,
                    type: 'S',
                    price: 90000,
                    status: Math.random() > 0.5 ? 'occupied' : 'available',
                });
            }
        }

        return seatList;
    }

    const handleSeatClick = (seatId: string) => {
        setSeats(seats.map(seat => {
            if (seat.id === seatId && seat.status !== 'occupied') {
                return {
                    ...seat,
                    status: seat.status === 'available' ? 'selected' : 'available',
                };
            }
            return seat;
        }));
    };

    const selectedSeats = seats.filter(s => s.status === 'selected');
    const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

    const handleConfirm = () => {
        if (selectedSeats.length === 0) {
            alert('좌석을 선택해주세요.');
            return;
        }

        onConfirm({
            showId: show.id,
            showTitle: show.title,
            showImage: show.image,
            date: new Date(selectedDate),
            time: selectedTime,
            seats: selectedSeats.map(s => s.id),
            totalPrice,
        });
    };

    const groupedSeats = seats.reduce((acc, seat) => {
        if (!acc[seat.row]) acc[seat.row] = [];
        acc[seat.row].push(seat);
        return acc;
    }, {} as Record<string, Seat[]>);

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-gray-900">{show.title}</h1>
                            <p className="text-sm text-gray-600">{show.venue}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* 좌석 선택 영역 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
                            {/* 날짜/시간 선택 */}
                            <div className="mb-6 lg:mb-8">
                                <h2 className="text-gray-900 mb-4">관람 일정 선택</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-2">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            관람 날짜
                                        </label>
                                        <select
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="2024-12-25">2025년 12월 25일 (목)</option>
                                            <option value="2024-12-26">2025년 12월 26일 (금)</option>
                                            <option value="2024-12-27">2025년 12월 27일 (토)</option>
                                            <option value="2024-12-28">2025년 12월 28일 (일)</option>
                                            <option value="2024-12-29">2025년 12월 29일 (월)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-2">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            관람 시간
                                        </label>
                                        <select
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="14:00">오후 2:00</option>
                                            <option value="19:00">오후 7:00</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 스테이지 */}
                            <div className="mb-6 lg:mb-8">
                                <div className="bg-gradient-to-b from-purple-100 to-purple-50 rounded-t-full py-3 sm:py-4 text-center mb-4 sm:mb-6">
                                    <span className="text-sm sm:text-base text-purple-900">STAGE</span>
                                </div>

                                {/* 좌석 범례 */}
                                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded"></div>
                                        <span className="text-xs sm:text-sm text-gray-600">VIP석</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded"></div>
                                        <span className="text-xs sm:text-sm text-gray-600">R석</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded"></div>
                                        <span className="text-xs sm:text-sm text-gray-600">S석</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded"></div>
                                        <span className="text-xs sm:text-sm text-gray-600">예매완료</span>
                                    </div>
                                </div>

                                {/* 좌석 배치도 */}
                                <div className="overflow-x-auto">
                                    <div className="min-w-[500px] space-y-2 sm:space-y-3">
                                        {rows.map((row) => (
                                            <div key={row} className="flex items-center justify-center gap-1 sm:gap-2">
                                                <div className="w-6 sm:w-8 text-center text-xs sm:text-sm text-gray-600">
                                                    {row}
                                                </div>
                                                {groupedSeats[row]?.map((seat) => (
                                                    <button
                                                        key={seat.id}
                                                        onClick={() => handleSeatClick(seat.id)}
                                                        disabled={seat.status === 'occupied'}
                                                        className={`
                              w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded text-xs sm:text-sm transition-all
                              ${seat.status === 'available' && seat.type === 'VIP' && 'bg-purple-200 hover:bg-purple-300 text-purple-900'}
                              ${seat.status === 'available' && seat.type === 'R' && 'bg-blue-200 hover:bg-blue-300 text-blue-900'}
                              ${seat.status === 'available' && seat.type === 'S' && 'bg-green-200 hover:bg-green-300 text-green-900'}
                              ${seat.status === 'selected' && seat.type === 'VIP' && 'bg-purple-600 text-white ring-2 ring-purple-400'}
                              ${seat.status === 'selected' && seat.type === 'R' && 'bg-blue-500 text-white ring-2 ring-blue-400'}
                              ${seat.status === 'selected' && seat.type === 'S' && 'bg-green-500 text-white ring-2 ring-green-400'}
                              ${seat.status === 'occupied' && 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                            `}
                                                    >
                                                        {seat.number}
                                                    </button>
                                                ))}
                                                <div className="w-6 sm:w-8 text-center text-xs sm:text-sm text-gray-600">
                                                    {row}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 예매 정보 영역 */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 sticky top-24">
                            <h2 className="text-gray-900 mb-4">예매 정보</h2>

                            {/* 공연 정보 */}
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <MapPin className="w-5 h-5 text-purple-600" />
                                    <span className="text-sm text-gray-600">{show.venue}</span>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                    <span className="text-sm text-gray-600">
                    {new Date(selectedDate).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                    })}
                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                    <span className="text-sm text-gray-600">{selectedTime}</span>
                                </div>
                            </div>

                            {/* 선택한 좌석 */}
                            <div className="mb-6">
                                <h3 className="text-gray-900 mb-3">선택한 좌석</h3>
                                {selectedSeats.length === 0 ? (
                                    <p className="text-sm text-gray-500">좌석을 선택해주세요</p>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedSeats.map((seat) => (
                                            <div
                                                key={seat.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="w-4 h-4 text-purple-600" />
                                                    <span className="text-sm text-gray-900">
                            {seat.id} ({seat.type}석)
                          </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">
                            {seat.price.toLocaleString()}원
                          </span>
                                                    <button
                                                        onClick={() => handleSeatClick(seat.id)}
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                    >
                                                        <X className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 가격 정보 */}
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-gray-600">선택 좌석 수</span>
                                    <span className="text-sm text-gray-900">{selectedSeats.length}석</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-900">총 금액</span>
                                    <span className="text-purple-600">{totalPrice.toLocaleString()}원</span>
                                </div>
                            </div>

                            {/* 예매하기 버튼 */}
                            <button
                                onClick={handleConfirm}
                                disabled={selectedSeats.length === 0}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {selectedSeats.length === 0 ? '좌석을 선택해주세요' : '예매하기'}
                            </button>

                            {/* 안내 사항 */}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-900 mb-1">예매 안내</p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• 최대 4석까지 선택 가능합니다.</li>
                                    <li>• 예매 취소는 공연 3일 전까지 가능합니다.</li>
                                    <li>• 좌석은 실제와 다를 수 있습니다.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
