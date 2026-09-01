import React from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import './GlobalLoader.css';

export const GlobalLoader: React.FC = () => {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="global-loader-overlay">
      <div className="global-loader-spinner" />
    </div>
  );
};