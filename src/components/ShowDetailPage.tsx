import { useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Tag, Users } from 'lucide-react';
import type { ShowDetailResponse } from '../api/types';
import type { AuthUser } from '../contexts/AppContexts';
import { ImageWithFallback } from './handling/ImageWithFallback';
import dayjs from 'dayjs';

interface ShowDetailPageProps {
  show: ShowDetailResponse;
  user: AuthUser | null;
  onBack: () => void;
  onBooking: (scheduleId: number) => void;
  onLoginClick: () => void;
}

export function ShowDetailPage({
  show,
  user,
  onBack,
  onBooking,
  onLoginClick,
}: ShowDetailPageProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    show.schedules.find((s) => s.status === 'AVAILABLE')?.id ?? show.schedules[0]?.id ?? null,
  );

  const selectedSchedule = show.schedules.find((s) => s.id === selectedScheduleId);

  const handleBooking = () => {
    if (!user) {
      onLoginClick();
      return;
    }
    if (!selectedScheduleId) return;
    onBooking(selectedScheduleId);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>목록으로</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* 포스터 */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="w-full aspect-[2/3] rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl overflow-hidden">
              <ImageWithFallback
                src={show.posterUrl}
                alt={show.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 상세 정보 */}
          <div>
            <div className="mb-4 sm:mb-6">
              <span className="inline-block px-3 py-1 bg-brand-soft text-brand-soft-fg rounded-full text-sm mb-2">
                {show.category}
              </span>
              <h1 className="text-gray-900 mb-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                {show.title}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">{show.description}</p>
            </div>

            {/* 기본 정보 */}
            <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 text-sm sm:text-base text-gray-700">
                <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(show.venue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-black transition-colors"
                >
                  {show.venue}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm sm:text-base text-gray-700">
                <Tag className="w-4 h-4 text-brand flex-shrink-0" />
                <span>
                  {show.minPrice.toLocaleString()}원 ~ {show.maxPrice.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 회차 선택 */}
            <div className="mb-6">
              <h3 className="text-gray-900 mb-3 text-base sm:text-lg">회차 선택</h3>
              {show.schedules.length === 0 ? (
                <p className="text-sm text-gray-500">등록된 회차가 없습니다</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {show.schedules.map((schedule) => {
                    const isSelected = schedule.id === selectedScheduleId;
                    const isSoldOut =
                      schedule.availableCount === 0 || !['AVAILABLE', 'ON_SALE'].includes(schedule.status);
                    return (
                      <button
                        key={schedule.id}
                        onClick={() => !isSoldOut && setSelectedScheduleId(schedule.id)}
                        disabled={isSoldOut}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-brand bg-brand-soft'
                            : isSoldOut
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-brand-ring hover:bg-brand-soft/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-brand flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {dayjs(schedule.scheduledAt).format('YYYY년 MM월 DD일 (ddd)')}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {dayjs(schedule.scheduledAt).format('HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{isSoldOut ? '매진' : `${schedule.availableCount}석 남음`}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 선택 회차 요약 */}
            {selectedSchedule && (
              <div className="mb-6 p-3 bg-brand-soft rounded-xl border border-neutral-200 text-sm text-brand-soft-fg">
                선택: {dayjs(selectedSchedule.scheduledAt).format('MM/DD HH:mm')} — 잔여{' '}
                {selectedSchedule.availableCount}석
              </div>
            )}

            {/* 예매 버튼 */}
            <button
              onClick={handleBooking}
              disabled={
                !selectedScheduleId || (selectedSchedule?.availableCount ?? 0) === 0
              }
              className="w-full py-4 bg-gradient-to-r from-brand to-accent text-white rounded-xl hover:from-brand-hover hover:to-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
            >
              {!user ? '로그인 후 예매하기' : '예매하기'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">예매 전 대기열에 진입합니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
