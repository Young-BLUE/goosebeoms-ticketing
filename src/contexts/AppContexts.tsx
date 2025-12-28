import { createContext, useContext, useState, type ReactNode } from 'react';
import type {Booking, Show, User, Event} from "../models/ticket-model.ts";
import {events, shows} from "../models/dummy-model.ts";

interface AppContextType {
    user: User | null;
    bookings: Booking[];
    shows: Show[];
    events: Event[];
    setUser: (user: User | null) => void;
    addBooking: (booking: Booking) => void;
    logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);

    const addBooking = (booking: Booking) => {
        setBookings([...bookings, booking]);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AppContext.Provider
            value={{
                user,
                bookings,
                shows,
                events,
                setUser,
                addBooking,
                logout,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
