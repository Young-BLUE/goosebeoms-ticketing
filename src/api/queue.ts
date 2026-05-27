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

// 시연용 dev API — 백엔드 dev 프로파일에서만 작동.
// 가짜 대기자를 큐 앞쪽에 추가해서 rank 줄어드는 모습을 시연한다.
export interface QueueSeedResponse {
  seeded: number;
  removedGhosts: number;
  totalWaiting: number;
}

export async function seedQueueGhosts(
  scheduleId: number,
  count = 500,
): Promise<QueueSeedResponse> {
  const res = await apiClient.post<ApiResponse<QueueSeedResponse>>(
    `/dev/queue/${scheduleId}/seed?count=${count}`,
  );
  return res.data.data;
}

export async function clearQueueGhosts(scheduleId: number): Promise<QueueSeedResponse> {
  const res = await apiClient.delete<ApiResponse<QueueSeedResponse>>(
    `/dev/queue/${scheduleId}/seed`,
  );
  return res.data.data;
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