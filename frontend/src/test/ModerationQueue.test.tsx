import './setup';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModerationPage } from '../pages/moderation/ModerationPage';
import { moderationApi } from '../api/moderationApi';
import type { ModerationQueueResponse } from '../types/community.types';

vi.mock('../api/moderationApi');

const MOCK_QUEUE_DATA: ModerationQueueResponse = {
  queue: {
    hiddenPosts: [
      {
        id: 'post-h-1',
        channel: 'WORKPLACE_BURNOUT',
        authorPseudonym: 'TiredPine99',
        title: 'Overwhelmed by work deadlines',
        content: 'This post accumulated 3 community reports and is hidden.',
        reportCount: 3,
        reasons: ['HARASSMENT', 'INAPPROPRIATE'],
        status: 'HIDDEN',
        createdAt: '2026-10-10T10:00:00Z',
      },
    ],
    hiddenComments: [
      {
        id: 'comm-h-1',
        postId: 'post-1',
        authorPseudonym: 'SwiftFalcon21',
        content: 'Hidden comment with abusive phrasing.',
        reportCount: 4,
        reasons: ['HATE_SPEECH'],
        status: 'HIDDEN',
        createdAt: '2026-10-10T11:00:00Z',
      },
    ],
    reportedPosts: [
      {
        id: 'post-r-1',
        channel: 'GENERAL_SUPPORT',
        authorPseudonym: 'CalmFern14',
        title: 'Mildly controversial post',
        content: 'This post has 1 report and remains visible.',
        reportCount: 1,
        reasons: ['SPAM'],
        status: 'VISIBLE',
        createdAt: '2026-10-10T12:00:00Z',
      },
    ],
    reportedComments: [
      {
        id: 'comm-r-1',
        postId: 'post-2',
        authorPseudonym: 'SilverFox33',
        content: 'Comment flagged as spam.',
        reportCount: 2,
        reasons: ['SPAM'],
        status: 'VISIBLE',
        createdAt: '2026-10-10T13:00:00Z',
      },
    ],
  },
};

describe('Moderation Queue & Authorized Actions Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(moderationApi.getModerationQueue).mockResolvedValue(MOCK_QUEUE_DATA);
  });

  it('renders moderation queue with category counts and pseudonym-only display', async () => {
    render(
      <MemoryRouter>
        <ModerationPage />
      </MemoryRouter>
    );

    // Crisis banner persistent
    expect(screen.getByTestId('crisis-resource-banner')).toBeInTheDocument();

    // Metric cards
    await waitFor(() => {
      expect(screen.getByTestId('hidden-posts-metric')).toHaveTextContent('1');
      expect(screen.getByTestId('hidden-comments-metric')).toHaveTextContent('1');
      expect(screen.getByTestId('reported-posts-metric')).toHaveTextContent('1');
      expect(screen.getByTestId('reported-comments-metric')).toHaveTextContent('1');
    });

    // Verify pseudonym-only display (BR-7: strictly pseudonym, no real user email or ID)
    expect(screen.getByText('TiredPine99')).toBeInTheDocument();
    expect(screen.getByText('3 Reports')).toBeInTheDocument();
    expect(screen.getByText('Overwhelmed by work deadlines')).toBeInTheDocument();
  });

  it('switches between queue tabs to inspect hidden and reported comments/posts', async () => {
    render(
      <MemoryRouter>
        <ModerationPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-hidden-comments')).toBeInTheDocument();
    });

    // Switch to Hidden Comments tab
    fireEvent.click(screen.getByTestId('tab-hidden-comments'));

    await waitFor(() => {
      expect(screen.getByText('SwiftFalcon21')).toBeInTheDocument();
      expect(screen.getByText('Hidden comment with abusive phrasing.')).toBeInTheDocument();
      expect(screen.getByText('4 Reports')).toBeInTheDocument();
    });

    // Switch to Reported Posts tab
    fireEvent.click(screen.getByTestId('tab-reported-posts'));

    await waitFor(() => {
      expect(screen.getByText('CalmFern14')).toBeInTheDocument();
      expect(screen.getByText('Mildly controversial post')).toBeInTheDocument();
    });
  });

  it('executes authorized RESTORE action with mandatory reasoning and updates queue', async () => {
    vi.mocked(moderationApi.executeAction).mockResolvedValueOnce({
      actionId: 'act-101',
      actionType: 'RESTORE',
      message: 'Post successfully restored to community feed.',
    });

    render(
      <MemoryRouter>
        <ModerationPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('take-action-btn-post-h-1')).toBeInTheDocument();
    });

    // Open action dialog
    fireEvent.click(screen.getByTestId('take-action-btn-post-h-1'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Execute Moderation Action')).toBeInTheDocument();
    expect(screen.getByTestId('moderation-target-pseudonym')).toHaveTextContent('TiredPine99');

    // Select RESTORE (default)
    const restoreRadio = screen.getByLabelText(/Restore Content/i);
    expect(restoreRadio).toBeChecked();

    // Fill reasoning
    const reasoningInput = screen.getByTestId('moderation-reasoning-input');
    fireEvent.change(reasoningInput, {
      target: { value: 'Post does not violate guidelines; false reporting detected.' },
    });

    // Submit action
    const submitBtn = screen.getByTestId('submit-moderation-action-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(moderationApi.executeAction).toHaveBeenCalledWith({
        actionType: 'RESTORE',
        postId: 'post-h-1',
        commentId: undefined,
        durationDays: undefined,
        reasoning: 'Post does not violate guidelines; false reporting detected.',
      });
    });

    // Item is removed from the queue
    await waitFor(() => {
      expect(screen.getByText(/Post successfully restored to community feed/i)).toBeInTheDocument();
      expect(screen.queryByTestId('moderation-item-post-h-1')).not.toBeInTheDocument();
    });
  });

  it('executes authorized PERMANENT_REMOVE action with reasoning', async () => {
    vi.mocked(moderationApi.executeAction).mockResolvedValueOnce({
      actionId: 'act-102',
      actionType: 'PERMANENT_REMOVE',
      message: 'Post permanently removed from community.',
    });

    render(
      <MemoryRouter>
        <ModerationPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('take-action-btn-post-h-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('take-action-btn-post-h-1'));

    // Select Permanent Removal
    const removeRadio = screen.getByLabelText(/Permanent Removal/i);
    fireEvent.click(removeRadio);

    const reasoningInput = screen.getByTestId('moderation-reasoning-input');
    fireEvent.change(reasoningInput, {
      target: { value: 'Severe harassment of peer violating conduct rules.' },
    });

    const submitBtn = screen.getByTestId('submit-moderation-action-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(moderationApi.executeAction).toHaveBeenCalledWith({
        actionType: 'PERMANENT_REMOVE',
        postId: 'post-h-1',
        commentId: undefined,
        durationDays: undefined,
        reasoning: 'Severe harassment of peer violating conduct rules.',
      });
    });
  });

  it('executes authorized TEMPORARY_SUSPENSION with <= 7 days limit selection', async () => {
    vi.mocked(moderationApi.executeAction).mockResolvedValueOnce({
      actionId: 'act-103',
      actionType: 'TEMPORARY_SUSPENSION',
      message: 'Author account temporarily suspended for 5 days.',
    });

    render(
      <MemoryRouter>
        <ModerationPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('take-action-btn-post-h-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('take-action-btn-post-h-1'));

    // Select Temporary Suspension
    const suspendRadio = screen.getByLabelText(/Temporary Suspension/i);
    fireEvent.click(suspendRadio);

    // Duration selector is displayed (<= 7 days)
    const durationSelect = screen.getByTestId('suspension-duration-select');
    expect(durationSelect).toBeInTheDocument();
    fireEvent.change(durationSelect, { target: { value: '5' } });

    const reasoningInput = screen.getByTestId('moderation-reasoning-input');
    fireEvent.change(reasoningInput, {
      target: { value: 'Repeated offensive remarks; 5-day cooling period applied.' },
    });

    const submitBtn = screen.getByTestId('submit-moderation-action-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(moderationApi.executeAction).toHaveBeenCalledWith({
        actionType: 'TEMPORARY_SUSPENSION',
        postId: 'post-h-1',
        commentId: undefined,
        durationDays: 5,
        reasoning: 'Repeated offensive remarks; 5-day cooling period applied.',
      });
    });
  });

  it('executes authorized ESCALATE action to senior administrative review', async () => {
    vi.mocked(moderationApi.executeAction).mockResolvedValueOnce({
      actionId: 'act-104',
      actionType: 'ESCALATE',
      message: 'Case escalated to senior administration.',
    });

    render(
      <MemoryRouter>
        <ModerationPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('take-action-btn-post-h-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('take-action-btn-post-h-1'));

    // Select Escalate
    const escalateRadio = screen.getByLabelText(/Escalate to Admin/i);
    fireEvent.click(escalateRadio);

    const reasoningInput = screen.getByTestId('moderation-reasoning-input');
    fireEvent.change(reasoningInput, {
      target: { value: 'Complex policy breach requiring executive admin review.' },
    });

    const submitBtn = screen.getByTestId('submit-moderation-action-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(moderationApi.executeAction).toHaveBeenCalledWith({
        actionType: 'ESCALATE',
        postId: 'post-h-1',
        commentId: undefined,
        durationDays: undefined,
        reasoning: 'Complex policy breach requiring executive admin review.',
      });
    });
  });

  it('handles backend authorization failure gracefully (never relies on frontend-only authorization)', async () => {
    vi.mocked(moderationApi.executeAction).mockRejectedValueOnce(
      new Error('Insufficient permissions. MODERATOR or ADMIN role required.')
    );

    render(
      <MemoryRouter>
        <ModerationPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('take-action-btn-post-h-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('take-action-btn-post-h-1'));

    const reasoningInput = screen.getByTestId('moderation-reasoning-input');
    fireEvent.change(reasoningInput, {
      target: { value: 'Attempting moderation without authoritative clearance' },
    });

    const submitBtn = screen.getByTestId('submit-moderation-action-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('moderation-error-alert')).toBeInTheDocument();
      expect(
        screen.getByText(/Insufficient permissions\. MODERATOR or ADMIN role required\./i)
      ).toBeInTheDocument();
    });
  });
});
