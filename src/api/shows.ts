import { apiClient } from './client';
import type { ApiResponse, ShowResponse, ShowDetailResponse, ShowScheduleResponse } from './types';

interface PageResponse<T> {
  content: T[];
  [key: string]: unknown;
}

export async function getShows(): Promise<ShowResponse[]> {
  const res = await apiClient.get<ApiResponse<PageResponse<ShowResponse> | ShowResponse[]>>('/shows');
  const data = res.data.data;
  // 페이지네이션 응답 처리
  if (data && !Array.isArray(data) && 'content' in data) {
    return (data as PageResponse<ShowResponse>).content;
  }
  return data as ShowResponse[];
}

export async function getShow(showId: number): Promise<ShowDetailResponse> {
  const res = await apiClient.get<ApiResponse<ShowDetailResponse>>(`/shows/${showId}`);
  return res.data.data;
}

export async function getShowSchedules(showId: number): Promise<ShowScheduleResponse[]> {
  const res = await apiClient.get<ApiResponse<ShowScheduleResponse[]>>(`/shows/${showId}/schedules`);
  return res.data.data;
}
