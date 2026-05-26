import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainPage } from '../components/MainPage';
import { useApp } from '../contexts/AppContexts';
import { getShowsPage } from '../api/shows';
import type { ShowResponse } from '../api/types';

const PAGE_SIZE = 12;

export function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useApp();
  const [shows, setShows] = useState<ShowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [categories, setCategories] = useState<string[]>(['전체']);

  const pageRef = useRef(0);
  const isLastRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const activeCategoryRef = useRef(activeCategory);
  activeCategoryRef.current = activeCategory;

  const fetchPage = useCallback(async (pageNum: number, category: string, reset: boolean) => {
    if (reset) {
      setLoading(true);
    } else {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }
    try {
      const result = await getShowsPage({
        page: pageNum,
        size: PAGE_SIZE,
        category: category !== '전체' ? category : undefined,
      });
      setShows((prev) => (reset ? result.content : [...prev, ...result.content]));
      setIsLast(result.last);
      isLastRef.current = result.last;
      pageRef.current = pageNum;

      // 전체 탭에서만 카테고리 목록 갱신 (누적)
      // if (category === '전체') {
      //   setCategories((prev) => {
      //     const next = new Set(prev);
      //     result.content.forEach((s) => next.add(s.category));
      //     return ['전체', ...Array.from(next).filter((c) => c !== '전체')];
      //   });
      // }
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    pageRef.current = 0;
    isLastRef.current = false;
    fetchPage(0, activeCategory, true);
  }, [activeCategory, fetchPage]);

  const loadMore = useCallback(() => {
    if (isLastRef.current || loadingMoreRef.current || loading) return;
    fetchPage(pageRef.current + 1, activeCategoryRef.current, false);
  }, [fetchPage, loading]);

  return (
    <MainPage
      shows={shows}
      loading={loading}
      loadingMore={loadingMore}
      isLast={isLast}
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      onLoadMore={loadMore}
      user={user}
      onShowClick={(showId) => navigate(`/show/${showId}`)}
      onLoginClick={() => navigate('/login')}
      onMyPageClick={() => navigate('/mypage')}
      onEventsClick={() => navigate('/events')}
      onLogout={() => {
        logout();
        navigate('/');
      }}
    />
  );
}
