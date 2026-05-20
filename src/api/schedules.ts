import { apiClient } from './client';
import type { ApiResponse, ZoneResponse, SeatResponse } from './types';

export async function getZones(scheduleId: number): Promise<ZoneResponse[]> {
  const res = await apiClient.get<ApiResponse<ZoneResponse[]>>(`/schedules/${scheduleId}/zones`);
  return res.data.data;
}

export async function getSeats(scheduleId: number): Promise<SeatResponse[]> {
  const res = await apiClient.get<ApiResponse<SeatResponse[]>>(`/schedules/${scheduleId}/seats`);
  return res.data.data;
}
