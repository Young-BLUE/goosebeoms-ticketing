import { useState } from 'react';
import { ArrowLeft, Gift, Tag, Trophy, Sparkles, Calendar, Users, Zap, Clock } from 'lucide-react';
import { EventCouponModal } from './EventCouponModal';
import type {Event, Show, User} from "../models/ticket-model.ts";

interface EventPageProps {
    events: Event[];
    shows: Show[];
    user: User | null;
    onBack: () => void;
    onShowClick: (showId: number) => void;
    onLoginClick: () => void;
}

export function EventPage({ events, shows, user, onBack, onShowClick, onLoginClick }: EventPageProps) {
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'coupon' | 'discount' | 'prize'>('all');
    const [claimedEvents, setClaimedEvents] = useState<Set<number>>(new Set());

    const selectedEvent = events.find(e => e.id === selectedEventId);

    const filteredEvents = filter === 'all'
        ? events
        : events.filter(e => e.type === filter);

    const handleClaimCoupon = (eventId: number, couponCode: string) => {
        setClaimedEvents(new Set([...claimedEvents, eventId]));
        setSelectedEventId(null);
        alert(`쿠폰이 발급되었습니다: ${couponCode}`);
    };

    const getEventIcon = (type: Event['type']) => {
        switch (type) {
            case 'coupon':
                return <Gift className="w-6 h-6" />;
            case 'discount':
                return <Tag className="w-6 h-6" />;
            case 'prize':
                return <Trophy className="w-6 h-6" />;
            default:
                return <Sparkles className="w-6 h-6" />;
        }
    };

    const getEventBadgeColor = (type: Event['type']) => {
        switch (type) {
            case 'coupon':
                return 'bg-purple-100 text-purple-700';
            case 'discount':
                return 'bg-blue-100 text-blue-700';
            case 'prize':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getEventTypeName = (type: Event['type']) => {
        switch (type) {
            case 'coupon':
                return '쿠폰';
            case 'discount':
                return '할인';
            case 'prize':
                return '경품';
            default:
                return '특별';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>홈으로</span>
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
                        <Gift className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-white mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl">이벤트 & 프로모션</h1>
                    <p className="text-purple-100 max-w-2xl mx-auto text-sm sm:text-base md:text-lg px-4">
                        다양한 혜택과 특별한 이벤트를 만나보세요
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Filter Tabs */}
                <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-all text-sm sm:text-base ${
                            filter === 'all'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        전체 이벤트
                    </button>
                    <button
                        onClick={() => setFilter('coupon')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-all text-sm sm:text-base ${
                            filter === 'coupon'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                        쿠폰
                    </button>
                    <button
                        onClick={() => setFilter('discount')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-all text-sm sm:text-base ${
                            filter === 'discount'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                        할인
                    </button>
                    <button
                        onClick={() => setFilter('prize')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg whitespace-nowrap transition-all text-sm sm:text-base ${
                            filter === 'prize'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                        경품
                    </button>
                </div>

                {/* Event Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-white rounded-xl p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-xs sm:text-sm">전체 이벤트</span>
                            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </div>
                        <div className="text-gray-900 text-base sm:text-lg">{events.length}개</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-xs sm:text-sm">쿠폰 이벤트</span>
                            <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="text-gray-900 text-base sm:text-lg">
                            {events.filter(e => e.type === 'coupon').length}개
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-xs sm:text-sm">진행중</span>
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div className="text-gray-900 text-base sm:text-lg">{events.length}개</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 text-xs sm:text-sm">발급받은 쿠폰</span>
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                        </div>
                        <div className="text-gray-900 text-base sm:text-lg">{claimedEvents.size}개</div>
                    </div>
                </div>

                {/* Events Grid */}
                {filteredEvents.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 sm:p-12 text-center">
                        <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-gray-900 mb-2 text-base sm:text-lg">이벤트가 없습니다</h3>
                        <p className="text-gray-600 text-sm sm:text-base">다른 카테고리를 확인해보세요</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredEvents.map((event) => {
                            const isClaimed = claimedEvents.has(event.id);
                            const isLowStock = event.remaining && event.total
                                ? (event.remaining / event.total) < 0.3
                                : false;

                            return (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getEventBadgeColor(event.type)}`}>
                        {getEventIcon(event.type)}
                          {getEventTypeName(event.type)}
                      </span>
                                        </div>
                                        {event.discount && (
                                            <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full">
                                                {event.discount}%
                                            </div>
                                        )}
                                        {isClaimed && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white text-gray-900 px-6 py-3 rounded-full">
                          ✓ 발급완료
                        </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-gray-900 mb-1">{event.title}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{event.subtitle}</p>

                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                            {event.description}
                                        </p>

                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                            <Calendar className="w-4 h-4" />
                                            <span>{event.period}</span>
                                        </div>

                                        {event.remaining !== undefined && event.total && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-gray-600">남은 쿠폰</span>
                                                    <span className={isLowStock ? 'text-red-500' : 'text-gray-900'}>
                            {event.remaining}/{event.total}
                          </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${
                                                            isLowStock ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                                        }`}
                                                        style={{ width: `${(event.remaining / event.total) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {event.showIds && event.showIds.length > 0 && (
                                            <div className="mb-4">
                                                <div className="text-xs text-gray-500 mb-2">적용 가능 공연</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {event.showIds.slice(0, 2).map((showId: number) => {
                                                        const show = shows.find(s => s.id === showId);
                                                        return show ? (
                                                            <button
                                                                key={showId}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onShowClick(showId);
                                                                }}
                                                                className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                                                            >
                                                                {show.title}
                                                            </button>
                                                        ) : null;
                                                    })}
                                                    {event.showIds.length > 2 && (
                                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              +{event.showIds.length - 2}
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => {
                                                if (event.type === 'coupon' || event.type === 'discount') {
                                                    if (!user) {
                                                        onLoginClick();
                                                        return;
                                                    }
                                                    setSelectedEventId(event.id);
                                                } else {
                                                    alert('이벤트 참여 페이지로 이동합니다');
                                                }
                                            }}
                                            disabled={isClaimed || (event.remaining !== undefined && event.remaining === 0)}
                                            className={`w-full py-3 rounded-lg transition-all ${
                                                isClaimed
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : event.remaining === 0
                                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 active:scale-95'
                                            }`}
                                        >
                                            {isClaimed
                                                ? '발급 완료'
                                                : event.remaining === 0
                                                    ? '쿠폰 소진'
                                                    : event.type === 'coupon' || event.type === 'discount'
                                                        ? '쿠폰 받기'
                                                        : '참여하기'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Notice */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-blue-900 mb-3">이벤트 안내</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>• 쿠폰은 1인 1회 발급이 원칙입니다</li>
                        <li>• 발급받은 쿠폰은 마이페이지에서 확인할 수 있습니다</li>
                        <li>• 쿠폰 유효기간이 지나면 자동으로 소멸됩니다</li>
                        <li>• 일부 이벤트는 로그인 후 참여 가능합니다</li>
                        <li>• 이벤트는 조기 종료되거나 변경될 수 있습니다</li>
                    </ul>
                </div>
            </div>

            {/* Event Coupon Modal */}
            {selectedEventId && selectedEvent && (
                <EventCouponModal
                    event={selectedEvent}
                    shows={shows}
                    onClose={() => setSelectedEventId(null)}
                    onClaim={(couponCode) => handleClaimCoupon(selectedEvent.id, couponCode)}
                />
            )}
        </div>
    );
}