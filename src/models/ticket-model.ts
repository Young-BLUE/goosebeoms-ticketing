export type PageType = 'main' | 'detail' | 'login' | 'mypage' | 'events';

export interface Show {
    id: number;
    title: string;
    subtitle: string;
    venue: string;
    period: string;
    runtime: string;
    age: string;
    price: string;
    image: string;
    description: string;
    cast: string[];
    schedule: string[];
    hasCoupon?: boolean;
    couponDiscount?: number;
}

export interface User {
    name: string;
    email: string;
    phone: string;
}

export interface Booking {
    id: string;
    showId: number;
    showTitle: string;
    showImage: string;
    date: Date|null;
    time: string;
    seats: string[];
    totalPrice: number;
    bookingDate: string;
}

export interface BookingData {
    couponCode?: string;
    selectedSeats?: string[];
    showTime?: string;
    showTitle?: string;
}

export interface Event {
    id: number;
    title: string;
    subtitle: string;
    type: 'coupon' | 'discount' | 'prize' | 'special';
    image: string;
    description: string;
    period: string;
    discount?: number;
    remaining?: number;
    total?: number;
    showIds?: number[];
}