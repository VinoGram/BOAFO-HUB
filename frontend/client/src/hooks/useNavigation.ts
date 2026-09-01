import { useLocation, type Path } from 'wouter';
import { useLoading } from '@/contexts/LoadingContext';
import { useCallback } from 'react';

export const useNavigation = () => {
  const [, wouterNavigate] = useLocation();
  const { showLoader } = useLoading();

  const navigate = useCallback((to: Path) => {
    showLoader();
    wouterNavigate(to);
  }, [showLoader, wouterNavigate]);

  return navigate;
};