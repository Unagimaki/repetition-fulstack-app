import { useMemo, useState } from "react";
import {
  useCreateCardMutation,
  useDeleteCardMutation,
  useDueCardsQuery,
  useResetCardMutation,
  useReviewCardMutation,
  useUpdateCardMutation
} from "../../../entities/card/api/cardApi";
import type { Card, CardInput, ReviewResult } from "../../../entities/card/model/types";

export function useHomeDashboard() {
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const { data: dueCards = [], error, isFetching } = useDueCardsQuery();
  const [createCardMutation, createState] = useCreateCardMutation();
  const [updateCardMutation, updateState] = useUpdateCardMutation();
  const [reviewCardMutation] = useReviewCardMutation();
  const [resetCardMutation] = useResetCardMutation();
  const [deleteCardMutation] = useDeleteCardMutation();

  const errorMessage = useMemo(() => {
    if (!error && !createState.error && !updateState.error) {
      return null;
    }
    return "Не удалось выполнить запрос. Проверь backend и попробуй еще раз.";
  }, [createState.error, error, updateState.error]);

  async function createCard(input: CardInput) {
    await createCardMutation(input).unwrap();
  }

  async function updateCard(input: CardInput) {
    if (!editingCard) return;
    await updateCardMutation({ id: editingCard.id, input }).unwrap();
    setEditingCard(null);
  }

  async function reviewCard(id: string, result: ReviewResult) {
    await reviewCardMutation({ id, result }).unwrap();
  }

  async function resetCard(id: string) {
    await resetCardMutation(id).unwrap();
  }

  async function deleteCard(id: string) {
    await deleteCardMutation(id).unwrap();
  }

  return {
    currentCard: dueCards[0],
    dueCardsCount: dueCards.length,
    editingCard,
    error: errorMessage,
    isFetching,
    createCard,
    updateCard,
    reviewCard,
    resetCard,
    deleteCard,
    setEditingCard
  };
}

