import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading energy data...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 text-emerald-600',
    md: 'w-8 h-8 text-emerald-600',
    lg: 'w-12 h-12 text-emerald-600',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-3">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>}
    </div>
  );
};
