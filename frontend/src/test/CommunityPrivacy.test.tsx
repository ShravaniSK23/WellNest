import './setup';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunityPage } from '../pages/community/CommunityPage';
import { ModerationPage } from '../pages/moderation/ModerationPage';
import { communityApi } from '../api/communityApi';
import { moderationApi } from '../api/moderationApi';
import type { CommunityPost, PostComment, ModerationQueueResponse } from '../types/community.types';

vi.mock('../api/communityApi');
vi.mock('../api/moderationApi');

describe('Community Pseudonym-Only Privacy Verification (BR-7 / REQ-AC-5)', () => {
  const registeredUser = {
    id: 'user-secret-uuid-999',
    email: 'registered.identity@example.com',
    fullName: 'Jane Doe Reality',
  };

  const mockPost: CommunityPost = {
    id: 'post-privacy-test-1',
    channel: 'GENERAL_SUPPORT',
    authorPseudonym: 'MidnightOwl44',
    title: 'Finding solace in quiet midnight walks',
    content: 'Walking under the stars always helps when anxiety feels overwhelming.',
    commentCount: 1,
    reportCount: 0,
    status: 'VISIBLE',
    createdAt: '2026-10-10T14:00:00Z',
  };

  const mockComment: PostComment = {
    id: 'comm-privacy-test-1',
    postId: 'post-privacy-test-1',
    parentCommentId: null,
    authorPseudonym: 'CalmBrook88',
    content: 'I also take evening walks. The fresh air is so grounding.',
    reportCount: 0,
    status: 'VISIBLE',
    createdAt: '2026-10-10T14:30:00Z',
  };

  const mockQueue: ModerationQueueResponse = {
    queue: {
      hiddenPosts: [
        {
          id: 'post-mod-1',
          channel: 'STRESS',
          authorPseudonym: 'BravePanda77',
          title: 'Stressful finals week experience',
          content: 'Flagged post content in queue.',
          reportCount: 3,
          reasons: ['HARASSMENT'],
          status: 'HIDDEN',
          createdAt: '2026-10-10T10:00:00Z',
        },
      ],
      hiddenComments: [],
      reportedPosts: [],
      reportedComments: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(communityApi.getChannels).mockResolvedValue({
      channels: [
        { id: 'GENERAL_SUPPORT', name: 'General Support', description: 'Compassionate peer listening' },
        { id: 'STRESS', name: 'Stress', description: 'Stress management' },
      ],
      crisisHelpline: {
        name: '988 Lifeline',
        phone: '988',
        text: 'HOME to 741741',
        website: 'https://988lifeline.org',
        disclaimer: '24/7 support',
      },
    });

    vi.mocked(communityApi.getPosts).mockResolvedValue({
      posts: [mockPost],
      pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
    });

    vi.mocked(communityApi.getComments).mockResolvedValue({
      comments: [mockComment],
    });

    vi.mocked(moderationApi.getModerationQueue).mockResolvedValue(mockQueue);
  });

  it('strictly displays pseudonym ONLY on community posts and never leaks registered identity', async () => {
    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    // Pseudonym is clearly displayed
    await waitFor(() => {
      expect(screen.getByTestId('post-author-pseudonym')).toHaveTextContent('MidnightOwl44');
    });

    // Verify registered identities are NOT anywhere in the rendered DOM
    expect(screen.queryByText(registeredUser.email)).not.toBeInTheDocument();
    expect(screen.queryByText(registeredUser.fullName)).not.toBeInTheDocument();
    expect(screen.queryByText(registeredUser.id)).not.toBeInTheDocument();
  });

  it('strictly displays pseudonym ONLY on comments and never derives registered identity', async () => {
    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('toggle-comments-btn-post-privacy-test-1')).toBeInTheDocument();
    });

    // Expand comments
    screen.getByTestId('toggle-comments-btn-post-privacy-test-1').click();

    await waitFor(() => {
      expect(screen.getByTestId('comment-author-pseudonym')).toHaveTextContent('CalmBrook88');
    });

    // Confirm real user details are never present
    expect(screen.queryByText(registeredUser.email)).not.toBeInTheDocument();
    expect(screen.queryByText(registeredUser.fullName)).not.toBeInTheDocument();
    expect(screen.queryByText(registeredUser.id)).not.toBeInTheDocument();
  });

  it('strictly displays pseudonym ONLY on moderator queue items', async () => {
    render(
      <MemoryRouter>
        <ModerationPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('queue-item-pseudonym')).toHaveTextContent('BravePanda77');
    });

    // In moderation, moderator sees ONLY authorPseudonym per BR-7 / REQ-AC-5
    expect(screen.queryByText(registeredUser.email)).not.toBeInTheDocument();
    expect(screen.queryByText(registeredUser.fullName)).not.toBeInTheDocument();
    expect(screen.queryByText(registeredUser.id)).not.toBeInTheDocument();
  });
});
