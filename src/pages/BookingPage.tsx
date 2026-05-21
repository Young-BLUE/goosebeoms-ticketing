import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { SeatSelectionPage } from '../components/SeatSelectionPage';

export function BookingPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as { scheduleId?: number; queueToken?: string } | null;
  const scheduleId = state?.scheduleId;
  const queueToken = state?.queueToken;

  if (!scheduleId || !queueToken) {
    return <Navigate to={id ? `/show/${id}` : '/'} replace />;
  }

  return (
    <SeatSelectionPage
      scheduleId={scheduleId}
      queueToken={queueToken}
      onBack={() => navigate(`/show/${id}`)}
      onComplete={(bookingId) =>
        navigate(`/booking/${bookingId}/payment`, { state: { scheduleId } })
      }
    />
  );
}
