export interface DashboardStats {
  activeJobs: number;
  totalWorkers: number;
  monthlyRevenue: number;
  completionRate: number;
}

export interface RecentJob {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string;
  salary: string;
  postedDate: string;
  status: string;
}

export interface ScheduleDay {
  day: string;
  shifts: number;
}

export interface PendingApproval {
  id: string;
  type: string;
  worker: string;
  timestamp: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  role: string;
  score: number;
  karmaCoins: number;
  avatar: string;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: string;
}
