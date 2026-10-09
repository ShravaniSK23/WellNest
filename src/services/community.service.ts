import { prisma } from '../db/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';

export const CRISIS_HELPLINE_METADATA = {
  name: '988 Suicide & Crisis Lifeline',
  phone: '988',
  text: 'Text HOME to 741741',
  website: 'https://988lifeline.org/',
  disclaimer: 'If you or someone you know is struggling or in crisis, help is available. You are not alone.',
};

export interface CreatePostDTO {
  channel: 'STRESS' | 'ACADEMIC_PRESSURE' | 'WORKPLACE_BURNOUT' | 'GENERAL_SUPPORT';
  title: string;
  content: string;
}

export interface CreateCommentDTO {
  content: string;
  parentCommentId?: string;
}

export interface ReportContentDTO {
  postId?: string;
  commentId?: string;
  reason: 'INAPPROPRIATE' | 'HARASSMENT' | 'SPAM' | 'HATE_SPEECH' | 'OTHER';
  details?: string;
}

const ADJECTIVES = ['Calm', 'Quiet', 'Serene', 'Gentle', 'Mindful', 'Peaceful', 'Hopeful', 'Brave', 'Kind', 'Bright'];
const NOUNS = ['River', 'Ocean', 'Forest', 'Meadow', 'Mountain', 'Breeze', 'Sky', 'Haven', 'Horizon', 'Star'];

export class CommunityService {
  // Stable Pseudonym Generator per HelpSeeker (BR-7, REQ-AC-1)
  public static async getOrCreatePseudonym(helpSeekerId: string): Promise<{ id: string; pseudonymName: string }> {
    let pseudonym = await prisma.pseudonym.findUnique({ where: { helpSeekerId } });
    if (!pseudonym) {
      // Generate a random stable pseudonym
      let pseudonymName = '';
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        attempts++;
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        const num = Math.floor(10 + Math.random() * 90);
        pseudonymName = `${adj}${noun}${num}`;

        const existing = await prisma.pseudonym.findUnique({ where: { pseudonymName } });
        if (!existing) isUnique = true;
      }

      pseudonym = await prisma.pseudonym.create({
        data: {
          helpSeekerId,
          pseudonymName,
        },
      });
    }

    return pseudonym;
  }

  // Check active posting suspension (BR-9)
  public static async checkSuspension(userId: string): Promise<void> {
    const activeSuspension = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: 'POSTING_SUSPENSION_ISSUED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSuspension && activeSuspension.payloadSummary) {
      const payload = activeSuspension.payloadSummary as any;
      if (payload.expiresAt) {
        const expiresAt = new Date(payload.expiresAt);
        if (expiresAt > new Date()) {
          throw new ForbiddenError(
            `Your community posting privileges are currently suspended until ${expiresAt.toISOString().split('T')[0]}.`
          );
        }
      }
    }
  }

  // Get Channels with Crisis Metadata (SF-1, SF-2)
  public static getChannels() {
    return {
      channels: [
        { id: 'STRESS', name: 'Stress & Anxiety', description: 'Discussion channel for managing stress and everyday anxiety.' },
        { id: 'ACADEMIC_PRESSURE', name: 'Academic Pressure', description: 'Peer support for exam stress, coursework, and school challenges.' },
        { id: 'WORKPLACE_BURNOUT', name: 'Workplace Burnout', description: 'Share experiences and coping strategies for career burnout.' },
        { id: 'GENERAL_SUPPORT', name: 'General Support', description: 'Open forum for positive encouragement and general mental wellness.' },
      ],
      crisisHelpline: CRISIS_HELPLINE_METADATA,
    };
  }

  // Create Community Post (REQ-AC-3)
  public static async createPost(userId: string, dto: CreatePostDTO) {
    await this.checkSuspension(userId);

    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    const validChannels = ['STRESS', 'ACADEMIC_PRESSURE', 'WORKPLACE_BURNOUT', 'GENERAL_SUPPORT'];
    if (!validChannels.includes(dto.channel)) {
      throw new BadRequestError(`Invalid channel. Must be one of: ${validChannels.join(', ')}`);
    }

    if (!dto.title || dto.title.length > 200) {
      throw new BadRequestError('Post title is required and must not exceed 200 characters');
    }

    if (!dto.content || dto.content.length > 2000) {
      throw new BadRequestError('Post content is required and must not exceed 2,000 characters (REQ-AC-3)');
    }

    const pseudonym = await this.getOrCreatePseudonym(helpSeeker.id);

    const post = await prisma.communityPost.create({
      data: {
        pseudonymId: pseudonym.id,
        channel: dto.channel,
        title: dto.title,
        content: dto.content,
        status: 'VISIBLE',
        reportCount: 0,
      },
    });

    return {
      id: post.id,
      channel: post.channel,
      authorPseudonym: pseudonym.pseudonymName,
      title: post.title,
      content: post.content,
      status: post.status,
      reportCount: post.reportCount,
      createdAt: post.createdAt,
    };
  }

  // List Posts with Pseudonym Privacy (BR-7, REQ-AC-5)
  public static async getPosts(channel?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: any = { status: 'VISIBLE' };
    if (channel) where.channel = channel;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pseudonym: { select: { pseudonymName: true } },
          comments: { where: { status: 'VISIBLE' }, select: { id: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    // Zero exposure of user_id, email, or real names in DTO
    const safePosts = posts.map((p) => ({
      id: p.id,
      channel: p.channel,
      authorPseudonym: p.pseudonym.pseudonymName,
      title: p.title,
      content: p.content,
      commentCount: p.comments.length,
      createdAt: p.createdAt,
    }));

    return { posts: safePosts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // Create Comment / Reply (REQ-AC-4)
  public static async createComment(userId: string, postId: string, dto: CreateCommentDTO) {
    await this.checkSuspension(userId);

    const helpSeeker = await prisma.helpSeeker.findUnique({ where: { userId } });
    if (!helpSeeker) throw new NotFoundError('HelpSeeker profile not found');

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post || post.status !== 'VISIBLE') {
      throw new NotFoundError('Community post not found');
    }

    if (!dto.content || dto.content.length > 1000) {
      throw new BadRequestError('Comment content is required and must not exceed 1,000 characters');
    }

    const pseudonym = await this.getOrCreatePseudonym(helpSeeker.id);

    const comment = await prisma.comment.create({
      data: {
        postId,
        pseudonymId: pseudonym.id,
        parentCommentId: dto.parentCommentId || null,
        content: dto.content,
        status: 'VISIBLE',
        reportCount: 0,
      },
    });

    return {
      id: comment.id,
      postId: comment.postId,
      parentCommentId: comment.parentCommentId,
      authorPseudonym: pseudonym.pseudonymName,
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  // List Comments for Post (REQ-AC-5)
  public static async getComments(postId: string) {
    const comments = await prisma.comment.findMany({
      where: { postId, status: 'VISIBLE' },
      orderBy: { createdAt: 'asc' },
      include: {
        pseudonym: { select: { pseudonymName: true } },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      parentCommentId: c.parentCommentId,
      authorPseudonym: c.pseudonym.pseudonymName,
      content: c.content,
      createdAt: c.createdAt,
    }));
  }

  // Report Content & Auto-Hide Trigger at 3+ Reports (BR-8, REQ-AC-6, REQ-AC-7)
  public static async reportContent(reporterUserId: string, dto: ReportContentDTO) {
    if (!dto.postId && !dto.commentId) {
      throw new BadRequestError('Either postId or commentId must be provided for report');
    }

    const validReasons = ['INAPPROPRIATE', 'HARASSMENT', 'SPAM', 'HATE_SPEECH', 'OTHER'];
    if (!validReasons.includes(dto.reason)) {
      throw new BadRequestError(`Invalid report reason. Must be one of: ${validReasons.join(', ')}`);
    }

    let isAutoHidden = false;
    let newReportCount = 0;

    const report = await prisma.$transaction(async (tx) => {
      const rep = await tx.report.create({
        data: {
          reporterUserId,
          postId: dto.postId || null,
          commentId: dto.commentId || null,
          reason: dto.reason,
          details: dto.details || null,
        },
      });

      if (dto.postId) {
        const post = await tx.communityPost.findUnique({ where: { id: dto.postId } });
        if (!post) throw new NotFoundError('Post not found');

        newReportCount = post.reportCount + 1;
        const shouldHide = newReportCount >= 3;
        isAutoHidden = shouldHide;

        await tx.communityPost.update({
          where: { id: dto.postId },
          data: {
            reportCount: newReportCount,
            status: shouldHide ? 'HIDDEN' : post.status,
          },
        });
      } else if (dto.commentId) {
        const comment = await tx.comment.findUnique({ where: { id: dto.commentId } });
        if (!comment) throw new NotFoundError('Comment not found');

        newReportCount = comment.reportCount + 1;
        const shouldHide = newReportCount >= 3;
        isAutoHidden = shouldHide;

        await tx.comment.update({
          where: { id: dto.commentId },
          data: {
            reportCount: newReportCount,
            status: shouldHide ? 'HIDDEN' : comment.status,
          },
        });
      }

      return rep;
    });

    return {
      reportId: report.id,
      contentHidden: isAutoHidden,
      currentReportCount: newReportCount,
      message: isAutoHidden
        ? 'Report submitted. Content has accumulated 3+ reports and is automatically hidden pending moderator review.'
        : 'Report submitted successfully.',
    };
  }
}
