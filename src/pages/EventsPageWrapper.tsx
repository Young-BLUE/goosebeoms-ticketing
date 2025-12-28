import { useNavigate } from 'react-router-dom';
import { EventPage } from '../components/EventPage';
import { useApp } from '../contexts/AppContexts.tsx';

export function EventsPageWrapper() {
    const navigate = useNavigate();
    const { events, shows, user } = useApp();

    return (
        <EventPage
            events={events}
            shows={shows}
            user={user}
            onBack={() => navigate('/')}
            onShowClick={(showId) => navigate(`/show/${showId}`)}
            onLoginClick={() => navigate('/login')}
        />
    );
}
