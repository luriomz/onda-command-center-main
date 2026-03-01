export interface EventCounts {
  total: number;
  draft: number;
  published: number;
  cancelled: number;
}

export interface TicketSales {
  total_tickets_sold: number;
  total_tickets_available: number;
  sell_through_rate: number;
}

export interface Revenue {
  total_revenue: number;
  currency: string;
}

export interface UpcomingEvent {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string | null;
  venue_name: string | null;
  tickets_sold: number;
  max_capacity: number | null;
}

export interface TopEvent {
  id: string;
  name: string;
  start_date: string;
  tickets_sold: number;
  revenue: number;
  status: string | null;
}

export interface CheckInStats {
  total_tickets: number;
  checked_in: number;
  checked_out: number;
  currently_inside: number;
}

export interface DashboardOverview {
  event_counts: EventCounts;
  ticket_sales: TicketSales;
  revenue: Revenue;
  upcoming_events: UpcomingEvent[];
  top_events: TopEvent[];
  check_in_stats: CheckInStats;
}
