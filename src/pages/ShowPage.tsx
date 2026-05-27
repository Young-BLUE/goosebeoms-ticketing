import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShowDetailPage } from '../components/ShowDetailPage';
import { useApp } from '../contexts/AppContexts';
import { getShow } from '../api/shows';
import type { ShowDetailResponse } from '../api/types';

export function ShowPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const [show, setShow] = useState<ShowDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getShow(Number(id))
      .then(setShow)
      .catch(() => setShow(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-gray-900 mb-4">공연을 찾을 수 없습니다</h1>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleBooking = (scheduleId: number) => {
    navigate(`/show/${id}/waiting`, { state: { scheduleId } });
  };

  return (
    <ShowDetailPage
      show={show}
      user={user}
      onBack={() => navigate('/')}
      onBooking={handleBooking}
      onLoginClick={() => navigate('/login')}
    />
  );
}
