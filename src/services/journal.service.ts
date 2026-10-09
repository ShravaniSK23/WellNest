import { prisma } from '../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export interface CreateJournalDTO {
  localDate: string;
  title?: string;
  content: string;
}

export class JournalService {
  public static async createEntry(userId: string, dto: CreateJournalDTO) {
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    const targetDate = new Date(`${dto.localDate}T00:00:00.000Z`);

    return prisma.journalEntry.create({
      data: {
        helpSeekerId: helpSeeker.id,
        localDate: targetDate,
        title: dto.title || null,
        content: dto.content,
      },
    });
  }

  public static async getEntries(userId: string) {
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    return prisma.journalEntry.findMany({
      where: { helpSeekerId: helpSeeker.id },
      orderBy: { localDate: 'desc' },
    });
  }

  public static async deleteEntry(userId: string, journalId: string) {
    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    const entry = await prisma.journalEntry.findUnique({ where: { id: journalId } });
    if (!entry) throw new NotFoundError('Journal entry not found');

    if (entry.helpSeekerId !== helpSeeker.id) {
      throw new ForbiddenError("You are not authorized to delete another user's journal entry");
    }

    await prisma.journalEntry.delete({ where: { id: journalId } });
    return { message: 'Journal entry deleted successfully' };
  }
}
