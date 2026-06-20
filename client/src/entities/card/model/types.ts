export type ReviewResult = "know" | "unsure" | "dont_know";

export type Card = {
  id: string;
  title: string;
  frontText: string;
  backText: string;
  tags: string[];
  level: number;
  levelLabel: string;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CardInput = {
  title: string;
  frontText: string;
  backText: string;
  tags: string[];
};

