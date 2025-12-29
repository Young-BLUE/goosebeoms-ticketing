import { useNavigate, useParams } from 'react-router-dom';
import { ShowDetailPage } from '../components/ShowDetailPage';
import {useApp} from "../contexts/AppContexts.tsx";

export function ShowPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { shows, user } = useApp();

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

    return (
        <ShowDetailPage
            show={show}
            user={user}
            onBack={() => navigate('/')}
            onBooking={() => navigate(`/show/${id}/booking`)}
            onLoginClick={() => navigate('/login')}
        />
    );
}
