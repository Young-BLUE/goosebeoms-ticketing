import { apiClient } from './client';
import type { ApiResponse, QueueStatusResponse } from './types';

export async function enterQueue(scheduleId: number): Promise<QueueStatusResponse> {
  const res = await apiClient.post<ApiResponse<QueueStatusResponse>>(`/queue/${scheduleId}/enter`);
  return res.data.data;
}

export async function getQueueStatus(scheduleId: number): Promise<QueueStatusResponse> {
  const res = await apiClient.get<ApiResponse<QueueStatusResponse>>(`/queue/${scheduleId}/status`);
  return res.data.data;
}

export async function leaveQueue(scheduleId: number): Promise<void> {
  await apiClient.post(`/queue/${scheduleId}/leave`);
}

export function subscribeQueue(
  scheduleId: number,
  onStatus: (status: QueueStatusResponse) => void,
  onError?: (err: Event) => void,
): EventSource {
  const token = localStorage.getItem('token');
  const url = `http://localhost:8888/queue/${scheduleId}/subscribe${token ? `?token=${token}` : ''}`;
  const es = new EventSource(url);
  const handler = (e: Event) => {
    const data = JSON.parse((e as MessageEvent).data) as QueueStatusResponse;
    onStatus(data);
  };
  // 초기 스냅샷, 순번 업데이트, 입장 승격 이벤트 모두 처리
  es.addEventListener('status', handler);
  es.addEventListener('rank', handler);
  es.addEventListener('ready', handler);
  if (onError) es.onerror = onError;
  return es;
}