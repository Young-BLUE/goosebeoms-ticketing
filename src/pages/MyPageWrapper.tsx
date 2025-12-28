import { useNavigate } from 'react-router-dom';
import { MyPage } from '../components/MyPage';
import { useApp } from '../contexts/AppContexts.tsx';

export function MyPageWrapper() {
    const navigate = useNavigate();
    const { user, bookings } = useApp();

    return (
        <MyPage
            user={user}
            bookings={bookings}
            onBack={() => navigate('/')}
            onShowClick={(showId) => navigate(`/show/${showId}`)}
        />
    );
}
