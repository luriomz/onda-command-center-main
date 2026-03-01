import { motion } from 'framer-motion';
import { Calendar, Ticket, DollarSign, Users } from 'lucide-react';
import type { EventCounts, TicketSales, Revenue, CheckInStats } from '@/types/dashboard';

interface StatCardsProps {
  eventCounts: EventCounts;
  ticketSales: TicketSales;
  revenue: Revenue;
  checkInStats: CheckInStats;
}

const formatNumber = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

const formatCurrency = (n: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(n) + ` ${currency}`;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.15 + i * 0.1 },
  }),
};

export const StatCards = ({
  eventCounts,
  ticketSales,
  revenue,
  checkInStats,
}: StatCardsProps) => {
  const sellThroughPct = Math.round(ticketSales.sell_through_rate);

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Events */}
      <motion.div
        className="glass-panel p-6"
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <p className="data-label">Events</p>
        </div>
        <p className="font-mono text-3xl font-bold text-foreground">
          {eventCounts.total}
        </p>
        <div className="mt-3 flex gap-3 text-xs">
          <span className="text-emerald-400">{eventCounts.published} published</span>
          <span className="text-muted-foreground">{eventCounts.draft} draft</span>
          <span className="text-red-400">{eventCounts.cancelled} cancelled</span>
        </div>
      </motion.div>

      {/* Tickets */}
      <motion.div
        className="glass-panel p-6"
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <p className="data-label">Tickets Sold</p>
        </div>
        <p className="font-mono text-3xl font-bold text-foreground">
          {formatNumber(ticketSales.total_tickets_sold)}
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              of {formatNumber(ticketSales.total_tickets_available)}
            </span>
            <span className="font-mono font-semibold text-primary">{sellThroughPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(sellThroughPct, 100)}%` }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Revenue */}
      <motion.div
        className="glass-panel p-6"
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
            <DollarSign className="h-5 w-5 text-amber-400" />
          </div>
          <p className="data-label">Revenue</p>
        </div>
        <p className="font-mono text-3xl font-bold text-foreground">
          {formatCurrency(revenue.total_revenue, revenue.currency)}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Across all events
        </p>
      </motion.div>

      {/* Check-ins */}
      <motion.div
        className="glass-panel p-6"
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="data-label">Check-ins</p>
        </div>
        <p className="font-mono text-3xl font-bold text-foreground">
          {formatNumber(checkInStats.checked_in)}
        </p>
        <div className="mt-3 flex gap-3 text-xs">
          <span className="text-emerald-400">{formatNumber(checkInStats.currently_inside)} inside</span>
          <span className="text-muted-foreground">{formatNumber(checkInStats.checked_out)} out</span>
        </div>
      </motion.div>
    </div>
  );
};
