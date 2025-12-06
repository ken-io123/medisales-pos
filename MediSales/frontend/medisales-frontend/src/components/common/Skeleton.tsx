import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export const Skeleton = ({
  className,
  variant = 'text',
  width,
  height,
  animate = true,
}: SkeletonProps) => {
  const baseStyles = 'bg-slate-200';
  const animationStyles = animate ? 'animate-pulse' : '';
  
  const variantStyles = {
    text: 'rounded-full',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={cn(
        baseStyles,
        animationStyles,
        variantStyles[variant],
        className
      )}
      style={style}
    />
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton = ({ rows = 5, columns = 6, className }: TableSkeletonProps) => {
  return (
    <div className={cn('overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-xl', className)}>
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width={100} height={16} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} width={100} height={20} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface CardSkeletonProps {
  className?: string;
  lines?: number;
}

export const CardSkeleton = ({ className, lines = 3 }: CardSkeletonProps) => {
  return (
    <div className={cn('rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-lg', className)}>
      <Skeleton width="60%" height={24} className="mb-4" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === lines - 1 ? '40%' : '100%'} height={16} />
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Skeleton width={120} height={40} variant="rounded" />
      </div>
    </div>
  );
};

interface ProductCardSkeletonProps {
  className?: string;
}

export const ProductCardSkeleton = ({ className }: ProductCardSkeletonProps) => {
  return (
    <div className={cn('rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-lg', className)}>
      <div className="flex items-start gap-4">
        <Skeleton variant="rounded" width={56} height={56} />
        <div className="flex-1 space-y-3">
          <Skeleton width="40%" height={16} />
          <Skeleton width="80%" height={20} />
          <Skeleton width="30%" height={16} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton height={16} />
        <Skeleton height={16} />
        <Skeleton height={16} />
        <Skeleton height={16} />
      </div>
    </div>
  );
};

interface StatCardSkeletonProps {
  className?: string;
}

export const StatCardSkeleton = ({ className }: StatCardSkeletonProps) => {
  return (
    <div className={cn('rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-xl', className)}>
      <div className="flex items-center justify-between">
        <Skeleton width="50%" height={16} />
        <Skeleton variant="circular" width={20} height={20} />
      </div>
      <Skeleton width="70%" height={36} className="mt-4" />
    </div>
  );
};

export default Skeleton;
