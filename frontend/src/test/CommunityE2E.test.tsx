import './setup';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunityPage } from '../pages/community/CommunityPage';
import { communityApi } from '../api/communityApi';
import type { CommunityPost, PostComment, ChannelInfo } from '../types/community.types';

vi.mock('../api/communityApi');

const MOCK_CHANNELS: ChannelInfo[] = [
  { id: 'STRESS', name: 'Stress', description: 'Stress management and relief' },
  { id: 'ACADEMIC_PRESSURE', name: 'Academic Pressure', description: 'Study and school well-being' },
  { id: 'WORKPLACE_BURNOUT', name: 'Workplace Burnout', description: 'Career and work-life balance' },
  { id: 'GENERAL_SUPPORT', name: 'General Support', description: 'Open compassionate listening' },
];

const MOCK_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    channel: 'WORKPLACE_BURNOUT',
    authorPseudonym: 'CalmPanda42',
    title: 'Navigating long work hours and setting gentle boundaries',
    content: 'Lately I have been finding it tough to switch off work notifications after 6 PM.',
    commentCount: 1,
    reportCount: 0,
    status: 'VISIBLE',
    createdAt: '2026-10-10T12:00:00Z',
  },
  {
    id: 'post-auto-hidden',
    channel: 'STRESS',
    authorPseudonym: 'QuietRiver99',
    title: 'Content that triggered community reports',
    content: 'This is the sensitive text of the auto-hidden post.',
    commentCount: 0,
    reportCount: 3,
    status: 'HIDDEN',
    createdAt: '2026-10-09T08:00:00Z',
  },
];

const MOCK_COMMENTS: PostComment[] = [
  {
    id: 'comment-1',
    postId: 'post-1',
    parentCommentId: null,
    authorPseudonym: 'SereneBreeze12',
    content: 'Setting phone to Do Not Disturb mode has really helped me protect my evenings.',
    reportCount: 0,
    status: 'VISIBLE',
    createdAt: '2026-10-10T13:00:00Z',
  },
];

describe('Anonymous Community E2E Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(communityApi.getChannels).mockResolvedValue({
      channels: MOCK_CHANNELS,
      crisisHelpline: {
        name: '988 Lifeline',
        phone: '988',
        text: 'HOME to 741741',
        website: 'https://988lifeline.org',
        disclaimer: 'Free 24/7 support',
      },
    });

    vi.mocked(communityApi.getPosts).mockResolvedValue({
      posts: MOCK_POSTS,
      pagination: { page: 1, limit: 15, total: 2, totalPages: 1 },
    });

    vi.mocked(communityApi.getComments).mockResolvedValue({
      comments: MOCK_COMMENTS,
    });
  });

  it('renders community page with topic channels, persistent crisis banner, and privacy guarantee banner', async () => {
    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    // Crisis banner is rendered
    expect(screen.getByTestId('crisis-resource-banner')).toBeInTheDocument();
    expect(screen.getByText(/988/)).toBeInTheDocument();

    // Privacy guarantee banner is rendered (BR-7)
    expect(screen.getByTestId('privacy-assurance-banner')).toBeInTheDocument();
    expect(screen.getByText(/Anonymous Peer Community Privacy Guarantee/i)).toBeInTheDocument();

    // Topic channel tabs rendered
    await waitFor(() => {
      expect(screen.getByTestId('channel-tab-ALL')).toBeInTheDocument();
      expect(screen.getByTestId('channel-tab-STRESS')).toBeInTheDocument();
      expect(screen.getByTestId('channel-tab-WORKPLACE_BURNOUT')).toBeInTheDocument();
    });

    // Posts feed rendered with author pseudonyms ONLY
    expect(screen.getByText('Navigating long work hours and setting gentle boundaries')).toBeInTheDocument();
    expect(screen.getByText('CalmPanda42')).toBeInTheDocument();
  });

  it('filters posts when selecting a specific topic channel', async () => {
    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('channel-tab-WORKPLACE_BURNOUT')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('channel-tab-WORKPLACE_BURNOUT'));

    await waitFor(() => {
      expect(communityApi.getPosts).toHaveBeenCalledWith('WORKPLACE_BURNOUT', 1, 15);
    });
  });

  it('creates a new post enforcing <= 2,000 characters limit, pseudonym privacy, and live counter', async () => {
    const createdPost: CommunityPost = {
      id: 'post-new-123',
      channel: 'STRESS',
      authorPseudonym: 'GentleEcho77',
      title: 'Mindful breathing practice that worked for me',
      content: 'Taking 4 slow breaths when anxious has noticeably grounded my thoughts.',
      commentCount: 0,
      reportCount: 0,
      status: 'VISIBLE',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(communityApi.createPost).mockResolvedValueOnce({
      post: createdPost,
    });

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    // Open Create Post Modal
    const createBtn = screen.getByTestId('open-create-post-modal-btn');
    fireEvent.click(createBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Community Post')).toBeInTheDocument();

    // Fill title
    const titleInput = screen.getByLabelText(/Post Title/i);
    fireEvent.change(titleInput, { target: { value: 'Mindful breathing practice that worked for me' } });

    // Fill content and verify character counter
    const contentTextarea = screen.getByLabelText(/Content \/ Message/i);
    fireEvent.change(contentTextarea, {
      target: { value: 'Taking 4 slow breaths when anxious has noticeably grounded my thoughts.' },
    });

    expect(screen.getByTestId('post-content-counter')).toHaveTextContent(
      `${contentTextarea.value.length} / 2,000`
    );

    // Verify privacy notice inside modal (BR-7)
    expect(screen.getByText(/Pseudonym-Only Privacy \(BR-7\)/i)).toBeInTheDocument();

    // Submit post
    const submitBtn = screen.getByTestId('submit-create-post-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(communityApi.createPost).toHaveBeenCalledWith({
        channel: 'GENERAL_SUPPORT',
        title: 'Mindful breathing practice that worked for me',
        content: 'Taking 4 slow breaths when anxious has noticeably grounded my thoughts.',
      });
    });

    // Success feedback and new post displayed
    await waitFor(() => {
      expect(screen.getByText('Mindful breathing practice that worked for me')).toBeInTheDocument();
      expect(screen.getByText('GentleEcho77')).toBeInTheDocument();
    });
  });

  it('expands comments drawer, displays comments, and adds a comment / reply (<= 1,000 chars)', async () => {
    const newComment: PostComment = {
      id: 'comment-new-456',
      postId: 'post-1',
      parentCommentId: null,
      authorPseudonym: 'HopefulDawn88',
      content: 'Thank you for this advice! Starting this routine tonight.',
      reportCount: 0,
      status: 'VISIBLE',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(communityApi.createComment).mockResolvedValueOnce({
      comment: newComment,
    });

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('toggle-comments-btn-post-1')).toBeInTheDocument();
    });

    // Expand comments
    fireEvent.click(screen.getByTestId('toggle-comments-btn-post-1'));

    await waitFor(() => {
      expect(communityApi.getComments).toHaveBeenCalledWith('post-1');
      expect(screen.getByText('SereneBreeze12')).toBeInTheDocument();
      expect(
        screen.getByText('Setting phone to Do Not Disturb mode has really helped me protect my evenings.')
      ).toBeInTheDocument();
    });

    // Submit a new comment
    const commentInput = screen.getByTestId('comment-input-textarea');
    fireEvent.change(commentInput, {
      target: { value: 'Thank you for this advice! Starting this routine tonight.' },
    });

    const submitCommentBtn = screen.getByTestId('submit-comment-btn');
    fireEvent.click(submitCommentBtn);

    await waitFor(() => {
      expect(communityApi.createComment).toHaveBeenCalledWith('post-1', {
        content: 'Thank you for this advice! Starting this routine tonight.',
        parentCommentId: undefined,
      });
    });

    // Verify comment rendered with pseudonym
    await waitFor(() => {
      expect(screen.getByText('HopefulDawn88')).toBeInTheDocument();
      expect(screen.getByText('Thank you for this advice! Starting this routine tonight.')).toBeInTheDocument();
    });
  });

  it('submits a report via ReportModal with violation reason and details', async () => {
    vi.mocked(communityApi.reportContent).mockResolvedValueOnce({
      reportId: 'rep-777',
      contentHidden: false,
      currentReportCount: 1,
      message: 'Report submitted successfully.',
    });

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('report-post-btn-post-1')).toBeInTheDocument();
    });

    // Open report modal
    fireEvent.click(screen.getByTestId('report-post-btn-post-1'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Report Community Content')).toBeInTheDocument();

    // Select HARASSMENT
    const harassmentOption = screen.getByLabelText(/Harassment or Bullying/i);
    fireEvent.click(harassmentOption);

    // Fill optional details
    const detailsInput = screen.getByPlaceholderText(/Provide any specific context/i);
    fireEvent.change(detailsInput, { target: { value: 'Inappropriate language in text' } });

    // Submit report
    const submitReportBtn = screen.getByTestId('submit-report-btn');
    fireEvent.click(submitReportBtn);

    await waitFor(() => {
      expect(communityApi.reportContent).toHaveBeenCalledWith({
        postId: 'post-1',
        commentId: undefined,
        reason: 'HARASSMENT',
        details: 'Inappropriate language in text',
      });
    });
  });

  it('enforces 3-report auto-hide behavior (BR-8 / REQ-AC-7): renders warning banner and allows reveal toggle', async () => {
    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    // Auto-hidden post has badge
    await waitFor(() => {
      expect(screen.getByText(/Content Automatically Hidden \(3 Community Reports\)/i)).toBeInTheDocument();
    });

    // Content is hidden by default
    expect(screen.queryByText('This is the sensitive text of the auto-hidden post.')).not.toBeInTheDocument();
    expect(screen.getByTestId('hidden-placeholder-message')).toBeInTheDocument();

    // Click "View Anyway"
    const toggleBtn = screen.getByTestId('toggle-hidden-content-btn');
    expect(toggleBtn).toHaveTextContent(/View Anyway/i);
    fireEvent.click(toggleBtn);

    // Content is now revealed
    expect(screen.getByText('This is the sensitive text of the auto-hidden post.')).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent(/Hide Again/i);

    // Click "Hide Again" to re-conceal
    fireEvent.click(toggleBtn);
    expect(screen.queryByText('This is the sensitive text of the auto-hidden post.')).not.toBeInTheDocument();
  });
});
