import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ErrorStateProps {
  message?: string;
}

export const ErrorState = ({ message }: ErrorStateProps) => {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['org-dashboard'] });
  };

  return (
    <motion.div
      className="glass-panel mt-6 flex flex-col items-center justify-center p-12"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10 mb-4">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        Unable to load dashboard
      </h3>

      <p className="max-w-md text-center text-sm text-muted-foreground mb-6">
        {message || 'Something went wrong while fetching your organization data. Please try again.'}
      </p>

      <button
        onClick={handleRetry}
        className="glass-pill flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:bg-white/[0.06]"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </motion.div>
  );
};
