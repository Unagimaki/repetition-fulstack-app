import { useState } from "react";
import { useListCardsQuery, useReviewCardMutation, useUpdateCardMutation } from "../../entities/card/api/cardApi";
import type { Card, CardInput, ReviewResult } from "../../entities/card/model/types";
import { CardForm } from "../../features/card-form";
import { TodayFilters } from "./ui/TodayFilters";

const timeFormat = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Saratov",
  hour: "2-digit",
  minute: "2-digit"
});

export function TodayPage() {
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState("");
  const [level, setLevel] = useState("");
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [updateCard, { isLoading: isUpdating }] = useUpdateCardMutation();
  const [editError, setEditError] = useState<string | null>(null);
  const [reviewCard, { isLoading: isReviewing }] = useReviewCardMutation();
  const [reviewError, setReviewError] = useState<string | null>(null);
  const { currentData: data, isFetching, isError } = useListCardsQuery(
    { todayOnly: true, tag, level: level === "" ? undefined : Number(level), page, pageSize: 50 },
    { pollingInterval: 60_000, refetchOnMountOrArgChange: true }
  );
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 50));

  function changeFilters(nextTag: string, nextLevel: string) {
    setTag(nextTag);
    setLevel(nextLevel);
    setPage(1);
  }

  async function handleUpdate(input: CardInput) {
    if (!editingCard) return;
    setEditError(null);
    try {
      await updateCard({ id: editingCard.id, input }).unwrap();
      setEditingCard(null);
      setPage(1);
    } catch {
      setEditError("Не удалось сохранить карточку. Попробуйте ещё раз.");
    }
  }

  async function handleReview(id: string, result: ReviewResult) {
    setReviewError(null);
    try {
      await reviewCard({ id, result }).unwrap();
      setPage(1);
    } catch {
      setReviewError("Не удалось сохранить результат. Попробуйте ещё раз.");
    }
  }

  return (
    <main className="page">
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Расписание · время Саратова</p>
            <h1>Повторение на сегодня</h1>
          </div>
          {data ? <span className="counter">{data.total}</span> : null}
        </div>
        <TodayFilters tag={tag} level={level} onChange={changeFilters} />
        {isError ? <div className="error-state surface">Не удалось загрузить карточки.</div> : null}
        {isFetching ? <div className="muted-state">Обновляю данные...</div> : null}
        {data?.items.length === 0 ? (
          <div className="empty-state surface">{tag || level ? "Нет карточек с выбранными фильтрами" : "На сегодня нет карточек для повторения"}</div>
        ) : null}
        {reviewError ? <div className="error-state surface" role="alert">{reviewError}</div> : null}
        <div className="section">
          {data?.items.map((card) => (
            <article className="surface today-card" key={card.id}>
              <time dateTime={card.nextReviewAt}>{timeFormat.format(new Date(card.nextReviewAt))}</time>
              <div>
                <h2>{card.title}</h2>
                <button className="ghost-button" type="button" disabled={isReviewing || isFetching} onClick={() => {
                  setEditError(null);
                  setEditingCard(card);
                }}>Редактировать</button>
                <p className="muted-state">Уровень {card.level + 1}: {card.levelLabel}</p>
                {card.tags.length > 0 ? (
                  <div className="tags-row">
                    {card.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                  </div>
                ) : null}
                <div className="review-actions today-review-actions">
                  <button className="primary-button" disabled={isReviewing || isFetching} onClick={() => handleReview(card.id, "know")} type="button">Знаю</button>
                  <button className="secondary-button" disabled={isReviewing || isFetching} onClick={() => handleReview(card.id, "unsure")} type="button">Не уверен</button>
                  <button className="danger-soft-button" disabled={isReviewing || isFetching} onClick={() => handleReview(card.id, "dont_know")} type="button">Не знаю</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {data && totalPages > 1 ? (
          <div className="pagination">
            <span>Страница {page} из {totalPages}. Всего: {data.total}</span>
            <div className="pagination-actions">
              <button className="secondary-button" disabled={page <= 1 || isFetching} onClick={() => setPage(page - 1)} type="button">Назад</button>
              <button className="secondary-button" disabled={page >= totalPages || isFetching} onClick={() => setPage(page + 1)} type="button">Вперёд</button>
            </div>
          </div>
        ) : null}
      </section>
      {editingCard ? (
        <div className="modal-backdrop">
          <div className="modal surface" role="dialog" aria-modal="true" aria-labelledby="today-edit-title">
            <h2 id="today-edit-title">Редактировать карточку</h2>
            {editError ? <div className="error-state surface" role="alert">{editError}</div> : null}
            <CardForm key={editingCard.id} card={editingCard} submitLabel="Сохранить" onSubmit={handleUpdate} onCancel={() => {
              if (!isUpdating) setEditingCard(null);
            }} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
