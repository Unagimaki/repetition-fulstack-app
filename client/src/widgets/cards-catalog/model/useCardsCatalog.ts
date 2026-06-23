import { useMemo, useState } from "react";
import {
  useDeleteCardMutation,
  useListCardsQuery,
  useResetCardMutation,
  useUpdateCardMutation
} from "../../../entities/card/api/cardApi";
import type { Card, CardInput } from "../../../entities/card/model/types";

const PAGE_SIZE = 12;

export function useCardsCatalog() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const cardsQuery = useListCardsQuery({ search, page, pageSize: PAGE_SIZE });
  const [updateCardMutation, updateCardState] = useUpdateCardMutation();
  const [deleteCardMutation, deleteCardState] = useDeleteCardMutation();
  const [resetCardMutation, resetCardState] = useResetCardMutation();
  const total = cardsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return {
    cards: cardsQuery.data?.items ?? [],
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages,
    search,
    editingCard,
    error: errorMessage,
    isFetching: cardsQuery.isFetching,
    isLoading: cardsQuery.isLoading,
    refetch: cardsQuery.refetch,
    setSearch: updateSearch,
    setPage,
    setEditingCard,
    updateCard,
    deleteCard,
    resetCard
  };
}
