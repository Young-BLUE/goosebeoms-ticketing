import type {Booking, PageType, User} from "../models/ticket-model.ts";
import {useState} from "react";
import {events, shows} from "../models/dummy-model.ts";
import {MainPage} from "./MainPage.tsx";
import {ShowDetailPage} from "./ShowDetailPage.tsx";
import {MyPage} from "./MyPage.tsx";
import {LoginPage} from "./LoginPage.tsx";
import {EventPage} from "./EventPage.tsx";

const Main = () => {
    const [currentPage, setCurrentPage] = useState<PageType>('main');
    const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);

    const handleShowClick = (showId: number) => {
        setSelectedShowId(showId);
        setCurrentPage('detail');
    };

    const handleLogin = (userData: User) => {
        setUser(userData);
        setCurrentPage('main');
    };

    const handleLogout = () => {
        setUser(null);
        setCurrentPage('main');
    };

    const handleBooking = (booking: Booking) => {
        setBookings([...bookings, booking]);
    };

    const selectedShow = shows.find(show => show.id === selectedShowId);

    return (
        <div className="min-h-screen bg-gray-50">
            {currentPage === 'main' && (
                <MainPage
                    shows={shows}
                    user={user}
                    onShowClick={handleShowClick}
                    onLoginClick={() => setCurrentPage('login')}
                    onMyPageClick={() => setCurrentPage('mypage')}
                    onEventsClick={() => setCurrentPage('events')}
                    onLogout={handleLogout}
                />
            )}
            {currentPage === 'detail' && selectedShow && (
                <ShowDetailPage
                    show={selectedShow}
                    user={user}
                    onBack={() => setCurrentPage('main')}
                    onBooking={handleBooking}
                    onLoginClick={() => setCurrentPage('login')}
                />
            )}
            {currentPage === 'login' && (
                <LoginPage
                    onLogin={handleLogin}
                    onBack={() => setCurrentPage('main')}
                />
            )}
            {currentPage === 'mypage' && (
                <MyPage
                    user={user}
                    bookings={bookings}
                    onBack={() => setCurrentPage('main')}
                    onShowClick={handleShowClick}
                />
            )}
            {currentPage === 'events' && (
                <EventPage
                    events={events}
                    shows={shows}
                    user={user}
                    onBack={() => setCurrentPage('main')}
                    onShowClick={handleShowClick}
                    onLoginClick={() => setCurrentPage('login')}
                />
            )}
        </div>
    );
}

export default Main;