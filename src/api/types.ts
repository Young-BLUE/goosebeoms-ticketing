// 공통 응답 래퍼
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

// Auth
export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  role: string;
}

// Shows
export interface ShowResponse {
  id: number;
  title: string;
  venue: string;
  category: string;
  categoryLabel: string;
  posterUrl: string;
  status: string;
  minPrice: number;
  maxPrice: number;
}

export interface ShowDetailResponse extends ShowResponse {
  description: string;
  schedules: ShowScheduleResponse[];
}

export interface ShowScheduleResponse {
  id: number;
  scheduledAt: string;
  totalCapacity: number;
  availableCount: number;
  status: string;
}

// Schedules
export interface ZoneResponse {
  id: number;
  name: string;
  price: number;
  rowCount: number;
  columnCount: number;
  availableSeats: number;
}

export interface SeatResponse {
  id: number;
  rowLabel: string;
  number: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  zoneId?: number;
}

// 좌석 상태 변경 이벤트 — SSE `seat-status` 페이로드
export interface SeatStatusChange {
  seatId: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  statusLabel?: string;
}

export interface SeatStatusEvent {
  scheduleId: number;
  changes: SeatStatusChange[];
}

// Queue
export interface QueueStatusResponse {
  state: 'WAITING' | 'ACTIVE' | 'NONE';
  position: number | null;       // 내 순번 (1부터)
  ahead: number | null;          // 내 앞 사람 수
  behind: number | null;         // 내 뒤 사람 수
  totalWaiting: number | null;   // 전체 대기 인원
  etaSeconds: number | null;     // 예상 대기 시간(초)
  token: string | null;          // ACTIVE 일 때만
  expiresAt: number | null;      // ACTIVE 토큰 만료 epoch(ms)
}

// Coupons
export interface CouponResponse {
  id: number;
  name: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  maxCount: number;
  issuedCount: number;
  remainingCount: number;
  validFrom: string;
  validUntil: string;
}

export interface UserCouponResponse {
  id: number;
  couponId: number;
  name: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  status: string;
  issuedAt: string;
}

// Bookings
export interface BookingSeat {
  zone: string;
  rowLabel: string;
  number: number;
  price: number;
}

export interface BookingResponse {
  id: number;
  showTitle: string;
  venue: string;
  scheduledAt: string;
  seats: BookingSeat[];
  originalPrice: number;
  discountPrice: number;
  finalPrice: number;
  status: string;
  createdAt: string;
}

export interface BookingSummaryResponse {
  id: number;
  showTitle: string;
  venue: string;
  scheduledAt: string;
  seatCount: number;
  finalPrice: number;
  status: string;
  createdAt: string;
}

export interface PaymentPrepareResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  clientKey: string;
  method: string;
}

// Booking hold request
export interface BookingHoldRequest {
  scheduleId: number;
  seatIds: number[];
  userCouponId?: number;
}
