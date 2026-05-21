import { apiClient } from './client';
import type { ApiResponse, ShowResponse, ShowDetailResponse, ShowScheduleResponse } from './types';

export interface ShowPage {
  content: ShowResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
  last: boolean;
}

export async function getShowsPage(params: {
  page: number;
  size?: number;
  category?: string;
}): Promise<ShowPage> {
  const { page, size = 12, category } = params;
  const res = await apiClient.get<ApiResponse<ShowPage>>('/shows', {
    params: { page, size, ...(category ? { category } : {}) },
  });
  return res.data.data;
}

export async function getShow(showId: number): Promise<ShowDetailResponse> {
  const res = await apiClient.get<ApiResponse<ShowDetailResponse>>(`/shows/${showId}`);
  return res.data.data;
}

export async function getShowSchedules(showId: number): Promise<ShowScheduleResponse[]> {
  const res = await apiClient.get<ApiResponse<ShowScheduleResponse[]>>(`/shows/${showId}/schedules`);
  return res.data.data;
}
