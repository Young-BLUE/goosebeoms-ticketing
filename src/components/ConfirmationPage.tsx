import { CheckCircle, Ticket, Calendar, Clock, MapPin, CreditCard } from 'lucide-react';
import dayjs from "dayjs";
import type {BookingData} from "../models/ticket-model.ts";

interface ConfirmationPageProps {
    bookingData: BookingData;
    onRestart: () => void;
}

export function ConfirmationPage({ bookingData, onRestart }: ConfirmationPageProps) {
    const { couponCode, selectedSeats = [], showTime = '19:00', showTitle = '뮤지컬 <해밀턴>' } = bookingData;
    const totalPrice = selectedSeats.length * 50000;
    const finalPrice = totalPrice * 0.7;
    const bookingNumber = `BK${dayjs().format("YYYYMMDD")}`;
    const bookingDate = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-gray-900 mb-2">예매가 완료되었습니다!</h1>
                    <p className="text-gray-600">예매 정보를 확인해주세요</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
                    {/* Ticket Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Ticket className="w-8 h-8" />
                                <div>
                                    <div className="text-sm opacity-90">예매번호</div>
                                    <div className="text-xl">{bookingNumber}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm opacity-90">예매일자</div>
                                <div>{bookingDate}</div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Body */}
                    <div className="p-6">
                        <div className="mb-6">
                            <h2 className="text-gray-900 mb-4">{showTitle}</h2>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                    <span>2024년 12월 25일 (수)</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                    <span>{showTime} 시작</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <MapPin className="w-5 h-5 text-purple-600" />
                                    <span>서울 예술의 전당 오페라극장</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6 mb-6">
                            <h3 className="text-gray-900 mb-3">좌석 정보</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedSeats.map(seat => (
                                    <span
                                        key={seat}
                                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg"
                                    >
                    {seat}
                  </span>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">총 {selectedSeats.length}석</p>
                        </div>

                        <div className="border-t border-gray-200 pt-6 mb-6">
                            <h3 className="text-gray-900 mb-3">결제 정보</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>티켓 금액</span>
                                    <span>{totalPrice.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>쿠폰 할인 (30%)</span>
                                    <span className="text-red-500">-{(totalPrice * 0.3).toLocaleString()}원</span>
                                </div>
                                {couponCode && (
                                    <div className="flex justify-between text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded">
                                        <span>쿠폰 코드</span>
                                        <span>{couponCode}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="text-gray-900">최종 결제 금액</span>
                                    <span className="text-purple-600">{finalPrice.toLocaleString()}원</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-blue-900 mb-1">결제 완료</p>
                                    <p className="text-xs text-blue-700">
                                        신한카드 **** **** **** 1234
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Perforated Edge */}
                    <div className="relative h-6 bg-gray-50">
                        <div className="absolute inset-x-0 top-0 flex justify-between px-2">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="w-3 h-3 bg-white rounded-full -mt-1.5" />
                            ))}
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="bg-gray-50 p-6 text-center">
                        <div className="inline-block bg-white p-4 rounded-xl mb-3">
                            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded flex items-center justify-center">
                                <div className="text-4xl">🎫</div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            공연 당일 이 QR 코드를 제시해주세요
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onRestart}
                        className="flex-1 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-xl hover:bg-purple-50 transition-colors"
                    >
                        처음으로 돌아가기
                    </button>
                    <button className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors">
                        예매 내역 저장
                    </button>
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-900">
                        <strong>안내사항</strong>
                    </p>
                    <ul className="text-xs text-yellow-800 mt-2 space-y-1">
                        <li>• 공연 시작 30분 전까지 입장하셔야 합니다.</li>
                        <li>• 예매 취소는 공연 3일 전까지 가능합니다.</li>
                        <li>• 예매 확인 메일이 발송되었습니다.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
