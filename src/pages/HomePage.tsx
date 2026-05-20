import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainPage } from '../components/MainPage';
import { useApp } from '../contexts/AppContexts';
import { getShows } from '../api/shows';
import type { ShowResponse } from '../api/types';

export function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useApp();
  const [shows, setShows] = useState<ShowResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShows()
      .then(setShows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainPage
      shows={shows}
      loading={loading}
      user={user}
      onShowClick={(showId) => navigate(`/show/${showId}`)}
      onLoginClick={() => navigate('/login')}
      onMyPageClick={() => navigate('/mypage')}
      onEventsClick={() => navigate('/events')}
      onLogout={() => {
        logout();
        navigate('/');
      }}
    />
  );
}
