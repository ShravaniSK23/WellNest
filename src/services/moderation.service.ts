import { prisma } from '../db/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { AuditService } from './audit.service.js';

export interface ModerationActionDTO {
  postId?: string;
  commentId?: string;
  actionType: 'RESTORE' | 'PERMANENT_REMOVE' | 'TEMPORARY_SUSPENSION' | 'ESCALATE';
  durationDays?: number;
  reasoning: string;
}

export class ModerationService {
  // Get Moderation Queue (REQ-AC-8)
  public static async getModerationQueue() {
    const [hiddenPosts, hiddenComments, reportedPosts, reportedComments] = await Promise.all([
      prisma.communityPost.findMany({
        where: { status: 'HIDDEN' },
        include: {
          pseudonym: { select: { pseudonymName: true, helpSeekerId: true } },
          reports: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.comment.findMany({
        where: { status: 'HIDDEN' },
        include: {
          pseudonym: { select: { pseudonymName: true, helpSeekerId: true } },
          reports: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.communityPost.findMany({
        where: { status: 'VISIBLE', reportCount: { gt: 0 } },
        include: {
          pseudonym: { select: { pseudonymName: true, helpSeekerId: true } },
          reports: true,
        },
        orderBy: { reportCount: 'desc' },
      }),
      prisma.comment.findMany({
        where: { status: 'VISIBLE', reportCount: { gt: 0 } },
        include: {
          pseudonym: { select: { pseudonymName: true, helpSeekerId: true } },
          reports: true,
        },
        orderBy: { reportCount: 'desc' },
      }),
    ]);

    return {
      queue: {
        hiddenPosts: hiddenPosts.map((p) => ({
          id: p.id,
          channel: p.channel,
          title: p.title,
          content: p.content,
          authorPseudonym: p.pseudonym.pseudonymName,
          reportCount: p.reportCount,
          reasons: Array.from(new Set(p.reports.map((r) => r.reason))),
          status: p.status,
          createdAt: p.createdAt,
        })),
        hiddenComments: hiddenComments.map((c) => ({
          id: c.id,
          postId: c.postId,
          content: c.content,
          authorPseudonym: c.pseudonym.pseudonymName,
          reportCount: c.reportCount,
          reasons: Array.from(new Set(c.reports.map((r) => r.reason))),
          status: c.status,
          createdAt: c.createdAt,
        })),
        reportedPosts: reportedPosts.map((p) => ({
          id: p.id,
          channel: p.channel,
          title: p.title,
          content: p.content,
          authorPseudonym: p.pseudonym.pseudonymName,
          reportCount: p.reportCount,
          reasons: Array.from(new Set(p.reports.map((r) => r.reason))),
          status: p.status,
        })),
        reportedComments: reportedComments.map((c) => ({
          id: c.id,
          postId: c.postId,
          content: c.content,
          authorPseudonym: c.pseudonym.pseudonymName,
          reportCount: c.reportCount,
          reasons: Array.from(new Set(c.reports.map((r) => r.reason))),
          status: c.status,
        })),
      },
    };
  }

  // Execute Moderation Action (BR-9, REQ-AC-9, REQ-AC-10, REQ-AC-11)
  public static async executeAction(moderatorUserId: string, dto: ModerationActionDTO) {
    if (!dto.postId && !dto.commentId) {
      throw new BadRequestError('Either postId or commentId must be provided for moderation action');
    }

    if (!dto.reasoning) {
      throw new BadRequestError('Moderation reasoning is required');
    }

    const moderator = await prisma.moderator.findUnique({ where: { userId: moderatorUserId } });
    const admin = await prisma.admin.findUnique({ where: { userId: moderatorUserId } });

    if (!moderator && !admin) {
      throw new BadRequestError('Moderator profile not found');
    }

    const modId = moderator ? moderator.id : admin!.id;

    let targetAuthorUserId: string | null = null;
    let resourceIdentifier = '';

    if (dto.postId) {
      const post = await prisma.communityPost.findUnique({
        where: { id: dto.postId },
        include: { pseudonym: { include: { helpSeeker: true } } },
      });
      if (!post) throw new NotFoundError('Post not found');
      targetAuthorUserId = post.pseudonym.helpSeeker.userId;
      resourceIdentifier = `post:${dto.postId}`;
    } else if (dto.commentId) {
      const comment = await prisma.comment.findUnique({
        where: { id: dto.commentId },
        include: { pseudonym: { include: { helpSeeker: true } } },
      });
      if (!comment) throw new NotFoundError('Comment not found');
      targetAuthorUserId = comment.pseudonym.helpSeeker.userId;
      resourceIdentifier = `comment:${dto.commentId}`;
    }

    // Execute Action logic
    if (dto.actionType === 'RESTORE') {
      if (dto.postId) {
        await prisma.communityPost.update({
          where: { id: dto.postId },
          data: { status: 'VISIBLE', reportCount: 0 },
        });
      } else if (dto.commentId) {
        await prisma.comment.update({
          where: { id: dto.commentId },
          data: { status: 'VISIBLE', reportCount: 0 },
        });
      }
    } else if (dto.actionType === 'PERMANENT_REMOVE') {
      if (dto.postId) {
        await prisma.communityPost.update({
          where: { id: dto.postId },
          data: { status: 'REMOVED' },
        });
      } else if (dto.commentId) {
        await prisma.comment.update({
          where: { id: dto.commentId },
          data: { status: 'REMOVED' },
        });
      }
    } else if (dto.actionType === 'TEMPORARY_SUSPENSION') {
      const durationDays = dto.durationDays || 7;
      if (durationDays > 7) {
        throw new BadRequestError('Moderator posting suspension cannot exceed 7 days (BR-9)');
      }

      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // Record suspension audit log targeting post author
      if (targetAuthorUserId) {
        await AuditService.logAction({
          userId: targetAuthorUserId,
          action: 'POSTING_SUSPENSION_ISSUED',
          resource: `user:${targetAuthorUserId}`,
          payloadSummary: { durationDays, expiresAt: expiresAt.toISOString(), reasoning: dto.reasoning },
        });
      }
    } else if (dto.actionType === 'ESCALATE') {
      // REQ-AC-10: Escalate case to Administrator
      await AuditService.logAction({
        userId: moderatorUserId,
        action: 'CASE_ESCALATED_TO_ADMIN',
        resource: resourceIdentifier,
        payloadSummary: { reasoning: dto.reasoning },
      });
    }

    // Record ModerationAction record
    const modAction = await prisma.moderationAction.create({
      data: {
        moderatorId: modId,
        postId: dto.postId || null,
        commentId: dto.commentId || null,
        actionType: dto.actionType,
        durationDays: dto.durationDays || null,
        reasoning: dto.reasoning,
      },
    });

    // Record Audit Log (SE-8, REQ-AC-11)
    await AuditService.logAction({
      userId: moderatorUserId,
      action: `MODERATION_${dto.actionType}`,
      resource: resourceIdentifier,
      payloadSummary: { actionId: modAction.id, reasoning: dto.reasoning },
    });

    return {
      actionId: modAction.id,
      actionType: dto.actionType,
      message: `Moderation action ${dto.actionType} executed successfully.`,
    };
  }
}
