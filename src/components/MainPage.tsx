import { Search, User as UserIcon, LogOut, Ticket, MapPin, Gift } from 'lucide-react';
import type { ShowResponse } from '../api/types';
import type { AuthUser } from '../contexts/AppContexts';
import { useMemo, useState } from 'react';
import { ImageWithFallback } from './handling/ImageWithFallback';

interface MainPageProps {
  shows: ShowResponse[];
  loading: boolean;
  user: AuthUser | null;
  onShowClick: (showId: number) => void;
  onLoginClick: () => void;
  onMyPageClick: () => void;
  onEventsClick: () => void;
  onLogout: () => void;
}

export function MainPage({
  shows,
  loading,
  user,
  onShowClick,
  onLoginClick,
  onMyPageClick,
  onEventsClick,
  onLogout,
}: MainPageProps) {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');

  const showList = useMemo(() => {
    let list = shows;
    if (activeCategory !== '전체') {
      list = list.filter((s) => s.category === activeCategory);
    }
    const q = searchText.trim();
    if (q) list = list.filter((s) => s.title.includes(q));
    return list;
  }, [shows, searchText, activeCategory]);

  const categories = ['전체', ...Array.from(new Set(shows.map((s) => s.category)))];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Ticket className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
              <h1 className="text-purple-600 text-base sm:text-lg md:text-xl lg:text-2xl whitespace-nowrap">
                Goosebeoms Ticket
              </h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              <button
                onClick={onEventsClick}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm sm:text-base"
              >
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">이벤트</span>
              </button>
              {user ? (
                <>
                  <button
                    onClick={onMyPageClick}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden md:inline truncate max-w-[100px]">{user.name}님</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden lg:inline">로그아웃</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  로그인
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-10 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-white mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl">
            지금 가장 인기있는 공연
          </h2>
          <p className="text-purple-100 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base md:text-lg px-4">
            특별한 순간을 위한 최고의 공연을 만나보세요
          </p>
          <div className="max-w-xl mx-auto px-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="공연명으로 검색하세요"
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm sm:text-base"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Shows */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          <h2 className="text-gray-900 text-lg sm:text-xl md:text-2xl">현재 공연</h2>
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap text-sm sm:text-base transition-colors ${
                  activeCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                <div className="h-64 sm:h-72 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : showList.length === 0 ? (
          <div className="text-center py-20 text-gray-500">검색 결과가 없습니다</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {showList.map((show) => (
              <div
                key={show.id}
                onClick={() => onShowClick(show.id)}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  <ImageWithFallback
                    src={show.posterUrl}
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        show.status === 'ON_SALE'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-400 text-white'
                      }`}
                    >
                      {show.status === 'ON_SALE' ? '예매중' : show.status}
                    </span>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="text-gray-900 mb-1 group-hover:text-purple-600 transition-colors text-base sm:text-lg line-clamp-1">
                    {show.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-600 mb-2">
                    {show.minPrice.toLocaleString()}원 ~{' '}
                    {show.maxPrice.toLocaleString()}원
                  </p>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{show.venue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 sm:py-12 mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <h4 className="text-white mb-3 sm:mb-4 text-base sm:text-lg">Goosebeoms Ticket</h4>
              <p className="text-xs sm:text-sm">
                최고의 공연을 가장 편리하게
                <br />
                예매하세요
              </p>
            </div>
            <div>
              <h4 className="text-white mb-3 sm:mb-4 text-base sm:text-lg">고객센터</h4>
              <p className="text-xs sm:text-sm">
                전화: 1544-1234
                <br />
                운영시간: 평일 09:00-18:00
              </p>
            </div>
            <div>
              <h4 className="text-white mb-3 sm:mb-4 text-base sm:text-lg">약관 및 정책</h4>
              <ul className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                <li>이용약관</li>
                <li>개인정보처리방침</li>
                <li>환불정책</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-xs sm:text-sm text-center">
            © 2024 Goosebeoms Ticket. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
