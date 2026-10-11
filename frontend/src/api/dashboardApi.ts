import { apiClient } from './apiClient';
import type {
  DashboardSummaryResponse,
  WeeklyReportRecord,
  RangeDays,
} from '../types/dashboard.types';

export const dashboardApi = {
  /**
   * Fetch complete dashboard summary for 7, 30, or 90 days range
   */
  async getSummary(rangeDays: RangeDays = 30): Promise<DashboardSummaryResponse> {
    const response = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary', {
      params: { rangeDays },
    });
    return response.data;
  },

  /**
   * Fetch generated weekly wellness report
   */
  async getWeeklyReport(): Promise<{ report: WeeklyReportRecord }> {
    const response = await apiClient.get<{ report: WeeklyReportRecord }>('/dashboard/reports/weekly');
    return response.data;
  },

  /**
   * Download weekly report as official PDF blob
   */
  async downloadWeeklyReportPdf(): Promise<Blob> {
    const response = await apiClient.get('/dashboard/reports/weekly/pdf', {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
