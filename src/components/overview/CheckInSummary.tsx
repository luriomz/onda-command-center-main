import { motion } from 'framer-motion';
import type { CheckInStats } from '@/types/dashboard';

interface CheckInSummaryProps {
  stats: CheckInStats;
}

export const CheckInSummary = ({ stats }: CheckInSummaryProps) => {
  const checkedInPct =
    stats.total_tickets > 0
      ? Math.round((stats.checked_in / stats.total_tickets) * 100)
      : 0;

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (checkedInPct / 100) * circumference;

  return (
    <motion.div
      className="glass-panel p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.75 }}
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Aggregate Check-in Status
      </h3>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Radial ring */}
        <div className="relative flex-shrink-0">
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            className="-rotate-90"
            aria-label={`Check-in progress: ${checkedInPct}%`}
          >
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              className="stroke-white/[0.06]"
              strokeWidth="8"
            />
            <motion.circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              className="stroke-primary"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold text-foreground">
              {checkedInPct}%
            </span>
            <span className="text-[10px] text-muted-foreground">Checked In</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid w-full flex-1 grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="data-label">Total Tickets</p>
            <p className="font-mono text-xl font-bold text-foreground">
              {stats.total_tickets.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="data-label">Checked In</p>
            <p className="font-mono text-xl font-bold text-emerald-400">
              {stats.checked_in.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="data-label">Checked Out</p>
            <p className="font-mono text-xl font-bold text-muted-foreground">
              {stats.checked_out.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="data-label">Currently Inside</p>
            <p className="font-mono text-xl font-bold text-primary">
              {stats.currently_inside.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
