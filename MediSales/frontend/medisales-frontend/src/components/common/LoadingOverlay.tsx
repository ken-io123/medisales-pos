import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  blur?: boolean;
}

export const LoadingOverlay = ({
  isLoading,
  message = 'Loading...',
  className,
  blur = true,
}: LoadingOverlayProps) => {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/30',
        blur && 'backdrop-blur-sm',
        className
      )}
    >
      <div className="rounded-3xl border-2 border-white/20 bg-white/95 p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
          <p className="text-base font-bold text-slate-900">{message}</p>
        </div>
      </div>
    </div>
  );
};

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2
      className={cn('animate-spin text-brand-primary', sizeClasses[size], className)}
    />
  );
};

interface ProgressBarProps {
  progress: number;
  className?: string;
  label?: string;
  showPercentage?: boolean;
}

export const ProgressBar = ({
  progress,
  className,
  label,
  showPercentage = true,
}: ProgressBarProps) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm font-semibold">
          {label && <span className="text-slate-700">{label}</span>}
          {showPercentage && (
            <span className="text-brand-primary">{clampedProgress.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className="h-3 overflow-hidden rounded-full bg-slate-200 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots = ({ className }: LoadingDotsProps) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-primary [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-primary [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-primary" />
    </div>
  );
};

export default LoadingOverlay;
