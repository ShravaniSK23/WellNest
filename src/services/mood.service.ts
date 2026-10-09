import { prisma } from '../db/prisma.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { QuoteService } from '../utils/quotes.js';
import { musicRecommendationService } from './music.service.js';

export const ALLOWED_MOOD_EMOJIS = ['😀', '😊', '😐', '😔', '😢', '😡', '😴', '😰', '🥳', '😌'];

export interface RecordMoodDTO {
  localDate: string; // "YYYY-MM-DD"
  moodEmoji: string;
  note?: string;
}

export class MoodService {
  public static async recordMood(userId: string, dto: RecordMoodDTO) {
    // 1. Validate emoji
    if (!ALLOWED_MOOD_EMOJIS.includes(dto.moodEmoji)) {
      throw new BadRequestError(`Invalid mood emoji. Allowed emojis: ${ALLOWED_MOOD_EMOJIS.join(', ')}`);
    }

    // 2. Validate note length (<= 500 chars)
    if (dto.note && dto.note.length > 500) {
      throw new BadRequestError('Mood note must not exceed 500 characters');
    }

    // 3. Find HelpSeeker profile
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) {
      throw new NotFoundError('HelpSeeker profile not found');
    }

    const targetDate = new Date(`${dto.localDate}T00:00:00.000Z`);

    // 4. Check for existing entry on same local date
    const existingEntry = await prisma.moodEntry.findUnique({
      where: {
        helpSeekerId_localDate: {
          helpSeekerId: helpSeeker.id,
          localDate: targetDate,
        },
      },
    });

    let moodEntry;
    let isSameDayEdit = false;

    if (existingEntry) {
      // Same-day edit operation
      isSameDayEdit = true;
      moodEntry = await prisma.moodEntry.update({
        where: { id: existingEntry.id },
        data: {
          moodEmoji: dto.moodEmoji,
          note: dto.note !== undefined ? dto.note : existingEntry.note,
        },
      });
    } else {
      // Create new mood entry
      moodEntry = await prisma.moodEntry.create({
        data: {
          helpSeekerId: helpSeeker.id,
          localDate: targetDate,
          moodEmoji: dto.moodEmoji,
          note: dto.note || null,
        },
      });
    }

    // 5. Update Timezone-Aware Streak Counter
    const streak = await this.updateStreak(helpSeeker.id, targetDate, isSameDayEdit);

    // 6. Get mood-based music recommendation
    const musicRecommendation = await musicRecommendationService.getRecommendationForMood(dto.moodEmoji);

    // 7. Get quote of the day
    const quote = QuoteService.getQuoteOfTheDay();

    return {
      moodEntry,
      streak,
      musicRecommendation,
      quote,
      isEdit: isSameDayEdit,
    };
  }

  private static async updateStreak(helpSeekerId: string, targetDate: Date, isSameDayEdit: boolean) {
    let streakRecord = await prisma.moodStreak.findUnique({ where: { helpSeekerId } });

    if (!streakRecord) {
      streakRecord = await prisma.moodStreak.create({
        data: {
          helpSeekerId,
          currentStreak: 1,
          longestStreak: 1,
          lastLoggedDate: targetDate,
        },
      });
      return streakRecord;
    }

    if (isSameDayEdit) {
      // Same day edit does not alter streak count
      return streakRecord;
    }

    if (!streakRecord.lastLoggedDate) {
      streakRecord = await prisma.moodStreak.update({
        where: { id: streakRecord.id },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(streakRecord.longestStreak, 1),
          lastLoggedDate: targetDate,
        },
      });
      return streakRecord;
    }

    // Compare date diff in calendar days
    const lastDateMs = Date.UTC(
      streakRecord.lastLoggedDate.getUTCFullYear(),
      streakRecord.lastLoggedDate.getUTCMonth(),
      streakRecord.lastLoggedDate.getUTCDate()
    );
    const targetDateMs = Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate()
    );

    const diffDays = Math.round((targetDateMs - lastDateMs) / (1000 * 60 * 60 * 24));

    let newStreak = streakRecord.currentStreak;

    if (diffDays === 1) {
      // Consecutive day -> Increment streak
      newStreak += 1;
    } else if (diffDays > 1) {
      // Missed 1 or more days -> Reset streak to 1
      newStreak = 1;
    } else if (diffDays < 0) {
      // Logging for a past historical date -> Do not break current streak, just log
      return streakRecord;
    }

    const newLongest = Math.max(streakRecord.longestStreak, newStreak);

    streakRecord = await prisma.moodStreak.update({
      where: { id: streakRecord.id },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastLoggedDate: targetDate,
      },
    });

    return streakRecord;
  }

  public static async getTodayMood(userId: string, localDateStr: string) {
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    const targetDate = new Date(`${localDateStr}T00:00:00.000Z`);

    const moodEntry = await prisma.moodEntry.findUnique({
      where: {
        helpSeekerId_localDate: {
          helpSeekerId: helpSeeker.id,
          localDate: targetDate,
        },
      },
    });

    const streak = await prisma.moodStreak.findUnique({ where: { helpSeekerId: helpSeeker.id } });
    const quote = QuoteService.getQuoteOfTheDay();

    return {
      moodEntry,
      streak: streak || { currentStreak: 0, longestStreak: 0 },
      quote,
    };
  }

  public static async getStreak(userId: string) {
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    const streak = await prisma.moodStreak.findUnique({ where: { helpSeekerId: helpSeeker.id } });
    return streak || { currentStreak: 0, longestStreak: 0 };
  }
}
