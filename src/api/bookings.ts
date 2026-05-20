import { apiClient } from './client';
import type {
  ApiResponse,
  BookingHoldRequest,
  BookingResponse,
  BookingSummaryResponse,
  PaymentPrepareResponse,
} from './types';

export async function holdBooking(data: BookingHoldRequest, queueToken?: string | null): Promise<BookingResponse> {
  const res = await apiClient.post<ApiResponse<BookingResponse>>('/bookings/hold', data, {
    headers: queueToken ? { 'X-Queue-Token': queueToken } : {},
  });
  return res.data.data;
}

export async function preparePayment(
  bookingId: number,
  method?: 'CARD' | 'VIRTUAL_ACCOUNT',
): Promise<PaymentPrepareResponse> {
  const res = await apiClient.post<ApiResponse<PaymentPrepareResponse>>(
    `/bookings/${bookingId}/payment/prepare`,
    { method },
  );
  return res.data.data;
}

export async function confirmPayment(
  bookingId: number,
  data: { paymentKey: string; orderId: string; amount: number },
): Promise<BookingResponse> {
  const res = await apiClient.post<ApiResponse<BookingResponse>>(
    `/bookings/${bookingId}/payment/confirm`,
    data,
  );
  return res.data.data;
}

export async function getMyBookings(): Promise<BookingSummaryResponse[]> {
  const res = await apiClient.get<ApiResponse<BookingSummaryResponse[]>>('/bookings/me');
  return res.data.data;
}

export async function getBooking(bookingId: number): Promise<BookingResponse> {
  const res = await apiClient.get<ApiResponse<BookingResponse>>(`/bookings/${bookingId}`);
  return res.data.data;
}

export async function cancelBooking(bookingId: number): Promise<void> {
  await apiClient.delete(`/bookings/${bookingId}`);
}
