import { useNavigate, useParams } from 'react-router-dom';
import type {Booking} from "../models/ticket-model.ts";
import {useApp} from "../contexts/AppContexts.tsx";
import {SeatSelectionPage} from "../components/SeatSelectionPage.tsx";

export function BookingPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { shows, addBooking } = useApp();

    const show = shows.find((s) => s.id === Number(id));

    if (!show) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-gray-900 mb-4">공연을 찾을 수 없습니다</h1>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        메인으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    const handleConfirm = (bookingData: {
        showId: number;
        showTitle: string;
        showImage: string;
        date: Date|null;
        time: string;
        seats: string[];
        totalPrice: number;
    }) => {
        const booking: Booking = {
            id: `BK${Date.now()}`,
            showId: bookingData.showId,
            showTitle: bookingData.showTitle,
            showImage: bookingData.showImage,
            date: bookingData.date,
            time: bookingData.time,
            seats: bookingData.seats,
            totalPrice: bookingData.totalPrice,
            bookingDate: new Date().toISOString(),
        };

        addBooking(booking);
        alert('예매가 완료되었습니다!');
        navigate('/mypage');
    };

    return (
        <SeatSelectionPage
            show={show}
            onBack={() => navigate(`/show/${id}`)}
            onConfirm={handleConfirm}
        />
    );
}
