import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={`animate-spin text-brand-primary ${sizeClasses[size]}`} />
  );
};

export const FullPageSpinner = () => (
  <div className="flex h-screen items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export const CenteredSpinner = () => (
    <div className="flex items-center justify-center p-8">
        <Spinner size="md" />
    </div>
);

export default Spinner;
