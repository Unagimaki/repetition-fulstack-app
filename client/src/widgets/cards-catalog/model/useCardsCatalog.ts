import { useMemo, useState } from "react";
import {
  useDeleteCardMutation,
  useListCardsQuery,
  useResetCardMutation,
  useUpdateCardMutation
} from "../../../entities/card/api/cardApi";
import type { Card, CardInput } from "../../../entities/card/model/types";

export function useCardsCatalog() {
  const [search, setSearch] = useState("");
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const cardsQuery = useListCardsQuery({ search });
  const [updateCardMutation, updateCardState] = useUpdateCardMutation();
  const [deleteCardMutation, deleteCardState] = useDeleteCardMutation();
  const [resetCardMutation, resetCardState] = useResetCardMutation();

  const errorMessage = useMemo(() => {
    if (cardsQuery.error) {
      return "Не удалось загрузить карточки.";
    }
    if (updateCardState.error) {
      return "Не удалось обновить карточку.";
    }
    if (deleteCardState.error) {
      return "Не удалось удалить карточку.";
    }
    if (resetCardState.error) {
      return "Не удалось сбросить уровень карточки.";
    }
    return null;
  }, [cardsQuery.error, deleteCardState.error, resetCardState.error, updateCardState.error]);

  async function updateCard(input: CardInput) {
    if (!editingCard) return;
    await updateCardMutation({ id: editingCard.id, input }).unwrap();
    setEditingCard(null);
  }

  async function deleteCard(id: string) {
    await deleteCardMutation(id).unwrap();
  }

  async function resetCard(id: string) {
    await resetCardMutation(id).unwrap();
  }

  return {
    cards: cardsQuery.data ?? [],
    search,
    editingCard,
    error: errorMessage,
    isFetching: cardsQuery.isFetching,
    isLoading: cardsQuery.isLoading,
    refetch: cardsQuery.refetch,
    setSearch,
    setEditingCard,
    updateCard,
    deleteCard,
    resetCard
  };
}
