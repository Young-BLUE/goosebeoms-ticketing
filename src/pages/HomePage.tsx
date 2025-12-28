import {MainPage} from "../components/MainPage.tsx";
import {useNavigate} from "react-router-dom";
import {useApp} from "../contexts/AppContexts.tsx";

export function HomePage() {
    const navigate = useNavigate();
    const { shows, user, logout } = useApp();

    return (
    <MainPage
        shows={shows}
        user={user}
        onShowClick={(showId) => navigate(`/show/${showId}`)}
        onLoginClick={() => navigate('/login')}
        onMyPageClick={() => navigate('/mypage')}
        onEventsClick={() => navigate('/events')}
        onLogout={() => {
            logout();
            navigate('/');
        }}
    />);
}