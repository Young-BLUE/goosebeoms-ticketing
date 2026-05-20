import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SeatSelectionPage } from '../components/SeatSelectionPage';

export function BookingPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as { scheduleId?: number; queueToken?: string } | null;
  const scheduleId = state?.scheduleId;
  const queueToken = state?.queueToken;

  if (!scheduleId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-gray-900 mb-4">회차 정보가 없습니다</h1>
          <button
            onClick={() => navigate(`/show/${id}`)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            공연 상세로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <SeatSelectionPage
      scheduleId={scheduleId}
      queueToken={queueToken ?? null}
      onBack={() => navigate(`/show/${id}`)}
      onComplete={(bookingId) =>
        navigate(`/booking/${bookingId}/payment`, { state: { scheduleId } })
      }
    />
  );
}
