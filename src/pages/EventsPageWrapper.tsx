import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventPage } from '../components/EventPage';
import { useApp } from '../contexts/AppContexts';
import { getCoupons } from '../api/coupons';
import type { CouponResponse } from '../api/types';

export function EventsPageWrapper() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);

  useEffect(() => {
    getCoupons().then(setCoupons).catch(() => {});
  }, []);

  return (
    <EventPage
      coupons={coupons}
      user={user}
      onBack={() => navigate('/')}
      onLoginClick={() => navigate('/login')}
    />
  );
}
