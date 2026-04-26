import { useState, useEffect, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function usePagination(total: number, initialPage: number = 1, pageSize: number = 20) {
  const [page, setPage] = useState(initialPage);
  
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  
  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => goToPage(page + 1), [page, goToPage]);
  const prevPage = useCallback(() => goToPage(page - 1), [page, goToPage]);
  
  return {
    page,
    setPage: goToPage,
    nextPage,
    prevPage,
    totalPages,
    start,
    end,
    hasNext: end < total,
    hasPrev: page > 1,
  };
}

export function useLazyLoad(ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  };

  return [storedValue, setValue];
}

export function useCurrency() {
  const [currency, setCurrency] = useState('TZS');
  
  useEffect(() => {
    const stored = localStorage.getItem('currency');
    if (stored) setCurrency(stored);
  }, []);
  
  return { currency, setCurrency };
}

export function useDateRange() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [range, setRange] = useState({
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    preset: 'thisMonth',
  });

  const setPreset = (preset: string) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (preset) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
        break;
      case 'thisWeek':
        start.setDate(now.getDate() - now.getDay());
        break;
      case 'lastWeek':
        start.setDate(now.getDate() - now.getDay() - 7);
        end.setDate(now.getDate() - now.getDay() - 1);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    setRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      preset,
    });
  };

  return { range, setRange, setPreset };
}