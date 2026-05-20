import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MyPage } from '../components/MyPage';
import { useApp } from '../contexts/AppContexts';
import { getMyBookings } from '../api/bookings';
import type { BookingSummaryResponse } from '../api/types';

export function MyPageWrapper() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMyBookings()
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <MyPage
      user={user}
      bookings={bookings}
      loading={loading}
      onBack={() => navigate('/')}
      onBookingClick={(bookingId) => navigate(`/booking/${bookingId}/confirmation`)}
      onRefresh={fetchBookings}
    />
  );
}
