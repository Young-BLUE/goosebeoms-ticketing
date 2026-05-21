import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ShowPage } from './pages/ShowPage';
import { LoginPageWrapper } from './pages/LoginPageWrapper';
import { EventsPageWrapper } from './pages/EventsPageWrapper';
import { MyPageWrapper } from './pages/MyPageWrapper';
import { AppProvider } from './contexts/AppContexts';
import { BookingPage } from './pages/BookingPage';
import { WaitingPage } from './pages/WaitingPage';
import { PaymentPage } from './pages/PaymentPage';
import { ConfirmationPage } from './pages/ConfirmationPage';

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/show/:id" element={<ShowPage />} />
            <Route path="/show/:id/waiting" element={<WaitingPage />} />
            <Route path="/show/:id/booking" element={<BookingPage />} />
            <Route path="/booking/:bookingId/payment" element={<PaymentPage />} />
            <Route path="/booking/:bookingId/confirmation" element={<ConfirmationPage />} />
            <Route path="/login" element={<LoginPageWrapper />} />
            <Route path="/mypage" element={<MyPageWrapper />} />
            <Route path="/events" element={<EventsPageWrapper />} />
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
