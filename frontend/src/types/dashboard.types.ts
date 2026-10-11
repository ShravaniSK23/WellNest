export type RangeDays = 7 | 30 | 90;

export interface MoodHistoryItem {
  id: string;
  date: string;
  moodEmoji: string;
  note?: string | null;
}

export interface DashboardAnalytics {
  frequentMood: string;
  variability: 'LOW' | 'MEDIUM' | 'HIGH';
  journalingFrequency: number;
  disclaimer: string;
}

export interface UpcomingAppointment {
  appointmentId: string;
  therapistName: string;
  qualifications?: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface RecommendedTherapist {
  id: string;
  fullName: string;
  biography: string;
  qualifications: string;
  yearsOfExperience: number;
  consultationFee: number;
  averageRating: number;
}

export interface DashboardSummaryResponse {
  rangeDays: number;
  moodHistory: MoodHistoryItem[];
  analytics: DashboardAnalytics;
  upcomingAppointments: UpcomingAppointment[];
  recommendedTherapists: RecommendedTherapist[];
  showNeedSomeoneToTalkPrompt: boolean;
}

export interface WeeklyReportSummary {
  periodStart: string;
  periodEnd: string;
  frequentMood: string;
  variability: string;
  totalMoodsLogged: number;
  journalingFrequency: number;
  disclaimer: string;
}

export interface WeeklyReportRecord {
  id: string;
  helpSeekerId: string;
  periodStart: string;
  periodEnd: string;
  summaryJson: WeeklyReportSummary;
  createdAt: string;
}
