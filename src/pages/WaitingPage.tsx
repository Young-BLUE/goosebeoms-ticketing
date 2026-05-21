import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { WaitingRoomPage } from '../components/WaitingRoomPage';

export function WaitingPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const scheduleId = (location.state as { scheduleId?: number } | null)?.scheduleId;

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
    <WaitingRoomPage
      scheduleId={scheduleId}
      onComplete={(queueToken) =>
        navigate(`/show/${id}/booking`, { state: { scheduleId, queueToken }, replace: true })
      }
      onLeave={() => navigate(`/show/${id}`)}
    />
  );
}
