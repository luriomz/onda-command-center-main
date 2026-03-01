import { AuthGuard } from '@/components/auth/AuthGuard';
import { OverviewHeader } from '@/components/overview/OverviewHeader';
import { StatCards } from '@/components/overview/StatCards';
import { UpcomingEventsTable } from '@/components/overview/UpcomingEventsTable';
import { TopEventsTable } from '@/components/overview/TopEventsTable';
import { CheckInSummary } from '@/components/overview/CheckInSummary';
import { OverviewSkeleton } from '@/components/overview/OverviewSkeleton';
import { ErrorState } from '@/components/overview/ErrorState';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';

const Overview = () => {
  const { data, isLoading, isError, error } = useDashboardOverview();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <OverviewHeader />

          {/* Loading state */}
          {isLoading && <OverviewSkeleton />}

          {/* Error state */}
          {isError && <ErrorState message={error?.message} />}

          {/* Dashboard content */}
          {data && (
            <>
              <StatCards
                eventCounts={data.event_counts}
                ticketSales={data.ticket_sales}
                revenue={data.revenue}
                checkInStats={data.check_in_stats}
              />

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <UpcomingEventsTable events={data.upcoming_events} />
                <TopEventsTable events={data.top_events} />
              </div>

              <div className="mt-6">
                <CheckInSummary stats={data.check_in_stats} />
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default Overview;
