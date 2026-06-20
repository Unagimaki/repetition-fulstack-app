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
};

export type TelegramDueResponse = {
  count: number;
  card: Card | null;
};

