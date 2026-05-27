import { apiClient } from './client';
import type {
  ApiResponse,
  ZoneResponse,
  SeatResponse,
  SeatStatusEvent,
} from './types';

export async function getZones(scheduleId: number): Promise<ZoneResponse[]> {
  const res = await apiClient.get<ApiResponse<ZoneResponse[]>>(`/schedules/${scheduleId}/zones`);
  return res.data.data;
}

// zoneId 미지정 시 schedule 전체 좌석. 백엔드 가이드는 `?zoneId=N` 사용을 권장.
export async function getSeats(
  scheduleId: number,
  zoneId?: number,
): Promise<SeatResponse[]> {
  const url =
    zoneId != null
      ? `/schedules/${scheduleId}/seats?zoneId=${zoneId}`
      : `/schedules/${scheduleId}/seats`;
  const res = await apiClient.get<ApiResponse<SeatResponse[]>>(url);
  return res.data.data;
}

// 좌석 상태 SSE 구독 — 다른 사용자의 점유/판매/해제가 들어오면 changes로 브로드캐스트.
// 초기 스냅샷은 getSeats로 별도 페치 후 이 SSE로 부분 갱신한다.
export function subscribeSeats(
  scheduleId: number,
  onChange: (event: SeatStatusEvent) => void,
  onError?: (err: Event) => void,
): EventSource {
  const token = localStorage.getItem('token');
  const url = `http://localhost:8888/schedules/${scheduleId}/seats/subscribe${token ? `?token=${token}` : ''}`;
  const es = new EventSource(url);
  es.addEventListener('seat-status', (ev: Event) => {
    const data = JSON.parse((ev as MessageEvent).data) as SeatStatusEvent;
    onChange(data);
  });
  if (onError) es.onerror = onError;
  return es;
}
