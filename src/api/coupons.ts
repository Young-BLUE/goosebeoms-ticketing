import { apiClient } from './client';
import type { ApiResponse, CouponResponse, UserCouponResponse } from './types';

export async function getCoupons(): Promise<CouponResponse[]> {
  const res = await apiClient.get<ApiResponse<CouponResponse[]>>('/coupons');
  return res.data.data;
}

export async function issueCoupon(couponId: number): Promise<UserCouponResponse> {
  const res = await apiClient.post<ApiResponse<UserCouponResponse>>(`/coupons/${couponId}/issue`);
  return res.data.data;
}

export async function getMyCoupons(): Promise<UserCouponResponse[]> {
  const res = await apiClient.get<ApiResponse<UserCouponResponse[]>>('/coupons/me');
  return res.data.data;
}
