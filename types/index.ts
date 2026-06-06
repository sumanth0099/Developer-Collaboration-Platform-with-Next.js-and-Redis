import { SubmissionStatus, DifficultyTag, VoteType, NotificationType } from "@prisma/client";

export type ContributionDay = {
  date: string;
  count: number;
};

export type FullSubmission = {
  id: string;
  title: string;
  description: string;
  codeContent: string;
  language: string;
  status: SubmissionStatus;
  difficultyTag: DifficultyTag;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    reputation: number;
  };
  reviews: Array<{
    id: string;
    content: string;
    lineReference: number | null;
    rating: number;
    isResolved: boolean;
    createdAt: string;
    reviewerId: string;
    reviewer: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
  }>;
  votes: Array<{ id: string; voteType: VoteType; userId: string }>;
  tags: Array<{ tag: { id: string; name: string; color: string } }>;
  snapshots: Array<{ id: string; imageUrl: string; uploadedAt: string }>;
  _count: { reviews: number; votes: number };
};

export type SubmissionListItem = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: SubmissionStatus;
  difficultyTag: DifficultyTag;
  viewCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    reputation: number;
  };
  _count: { reviews: number; votes: number };
  tags: Array<{ id: string; name: string; color: string }>;
  userVote: VoteType | null;
};

export type LeaderboardEntry = {
  rank: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    reputation: number;
  };
  score: number;
  breakdown: {
    reputationPoints: number;
    reviewBonus: number;
    submissionBonus: number;
    voteBonus: number;
  };
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  metadata: any;
};
