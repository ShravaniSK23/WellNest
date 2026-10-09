import PDFDocument from 'pdfkit';
import { prisma } from '../db/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export class DashboardService {
  public static async getSummary(userId: string, rangeDays: number = 30) {
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    const validRanges = [7, 30, 90];
    const days = validRanges.includes(rangeDays) ? rangeDays : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Fetch Mood History for range (Owner-only filter)
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        helpSeekerId: helpSeeker.id,
        localDate: { gte: startDate },
      },
      orderBy: { localDate: 'asc' },
    });

    // 2. Analytics: Frequent Mood & Variability
    const frequentMood = this.computeFrequentMood(moodEntries);
    const variability = this.computeVariability(moodEntries);

    // 3. Analytics: Journaling Frequency in range
    const journalingFrequency = await prisma.journalEntry.count({
      where: {
        helpSeekerId: helpSeeker.id,
        localDate: { gte: startDate },
      },
    });

    // 4. Upcoming Confirmed Appointments for HelpSeeker
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        helpSeekerId: helpSeeker.id,
        status: 'CONFIRMED',
        startTime: { gte: new Date() },
      },
      include: {
        therapist: { select: { fullName: true, qualifications: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // 5. Up to 3 Verified Therapist Recommendations
    const recommendedTherapists = await prisma.therapist.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        isVisible: true,
      },
      select: {
        id: true,
        fullName: true,
        biography: true,
        qualifications: true,
        yearsOfExperience: true,
        consultationFee: true,
        averageRating: true,
      },
      take: 3,
      orderBy: { averageRating: 'desc' },
    });

    // 6. 'Need someone to talk to?' prompt rule (REQ-WD-7)
    const showNeedSomeoneToTalkPrompt = upcomingAppointments.length === 0;

    return {
      rangeDays: days,
      moodHistory: moodEntries.map((e) => ({
        id: e.id,
        date: e.localDate.toISOString().split('T')[0],
        moodEmoji: e.moodEmoji,
        note: e.note,
      })),
      analytics: {
        frequentMood,
        variability,
        journalingFrequency,
        disclaimer: 'Informational summary only. Not a clinical diagnosis.',
      },
      upcomingAppointments: upcomingAppointments.map((a) => ({
        appointmentId: a.id,
        therapistName: a.therapist.fullName,
        qualifications: a.therapist.qualifications,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
      })),
      recommendedTherapists,
      showNeedSomeoneToTalkPrompt,
    };
  }

  public static async generateWeeklyReport(userId: string) {
    const summary = await this.getSummary(userId, 7);
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });

    const reportJson = {
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      frequentMood: summary.analytics.frequentMood,
      variability: summary.analytics.variability,
      totalMoodsLogged: summary.moodHistory.length,
      journalingFrequency: summary.analytics.journalingFrequency,
      disclaimer: 'Informational summary only. Not a clinical diagnosis.',
    };

    return prisma.wellnessReport.create({
      data: {
        helpSeekerId: helpSeeker!.id,
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        summaryJson: reportJson,
      },
    });
  }

  public static async generateReportPdfBuffer(userId: string): Promise<Buffer> {
    const summary = await this.getSummary(userId, 30);
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(22).fillColor('#2C3E50').text('WellNest - Personal Wellness Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#7F8C8D').text(`Generated for: ${helpSeeker?.fullName || 'Valued User'}`, { align: 'center' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Section: Summary Metrics
      doc.fontSize(16).fillColor('#2980B9').text('30-Day Wellness Analytics Summary');
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#333333');
      doc.text(`Most Frequent Mood: ${summary.analytics.frequentMood || 'N/A'}`);
      doc.text(`Mood Variability: ${summary.analytics.variability}`);
      doc.text(`Total Mood Entries Logged: ${summary.moodHistory.length}`);
      doc.text(`Journaling Frequency: ${summary.analytics.journalingFrequency} entries`);
      doc.moveDown(1.5);

      // Section: Mood Logs
      doc.fontSize(16).fillColor('#2980B9').text('Recent Mood Logs');
      doc.moveDown(0.5);
      summary.moodHistory.slice(0, 10).forEach((entry) => {
        doc.fontSize(11).fillColor('#2C3E50').text(`• ${entry.date}: ${entry.moodEmoji} ${entry.note ? `("${entry.note}")` : ''}`);
      });
      doc.moveDown(2);

      // Safety Disclaimer (SF-3)
      doc.fontSize(10).fillColor('#C0392B').text('Disclaimer: Informational summary only. Not a clinical diagnosis.', { align: 'center' });

      doc.end();
    });
  }

  private static computeFrequentMood(entries: Array<{ moodEmoji: string }>): string {
    if (entries.length === 0) return 'N/A';
    const counts: Record<string, number> = {};
    let maxCount = 0;
    let frequent = entries[0].moodEmoji;

    for (const e of entries) {
      counts[e.moodEmoji] = (counts[e.moodEmoji] || 0) + 1;
      if (counts[e.moodEmoji] > maxCount) {
        maxCount = counts[e.moodEmoji];
        frequent = e.moodEmoji;
      }
    }
    return frequent;
  }

  private static computeVariability(entries: Array<{ moodEmoji: string }>): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (entries.length < 3) return 'LOW';
    const uniqueMoods = new Set(entries.map((e) => e.moodEmoji)).size;
    if (uniqueMoods <= 2) return 'LOW';
    if (uniqueMoods <= 4) return 'MEDIUM';
    return 'HIGH';
  }
}
