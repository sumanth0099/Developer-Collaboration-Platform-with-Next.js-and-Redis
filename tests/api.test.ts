import { describe, it, expect } from "vitest";
import { resolveVoteAction } from "@/lib/utils";
import { Vote, VoteType } from "@prisma/client";

function mockVote(voteType: VoteType): Vote {
  return {
    id: "vote-1",
    voteType,
    createdAt: new Date(),
    submissionId: "sub-1",
    userId: "user-1",
  };
}

describe("resolveVoteAction", () => {
  it("returns create action when no existing vote", () => {
    const result = resolveVoteAction(null, "UPVOTE");
    expect(result).toEqual({ action: "create", voteType: "UPVOTE" });
  });

  it("returns create action with DOWNVOTE when no existing vote", () => {
    const result = resolveVoteAction(null, "DOWNVOTE");
    expect(result).toEqual({ action: "create", voteType: "DOWNVOTE" });
  });

  it("returns delete when existing vote matches incoming type (UPVOTE toggle off)", () => {
    const result = resolveVoteAction(mockVote("UPVOTE"), "UPVOTE");
    expect(result).toEqual({ action: "delete" });
  });

  it("returns delete when existing vote matches incoming type (DOWNVOTE toggle off)", () => {
    const result = resolveVoteAction(mockVote("DOWNVOTE"), "DOWNVOTE");
    expect(result).toEqual({ action: "delete" });
  });

  it("returns update when existing vote differs from incoming (UPVOTE -> DOWNVOTE)", () => {
    const result = resolveVoteAction(mockVote("UPVOTE"), "DOWNVOTE");
    expect(result).toEqual({ action: "update", voteType: "DOWNVOTE" });
  });

  it("returns update when existing vote differs from incoming (DOWNVOTE -> UPVOTE)", () => {
    const result = resolveVoteAction(mockVote("DOWNVOTE"), "UPVOTE");
    expect(result).toEqual({ action: "update", voteType: "UPVOTE" });
  });
});
