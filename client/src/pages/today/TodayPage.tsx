import { useState } from "react";
import { useListCardsQuery } from "../../entities/card/api/cardApi";

const timeFormat = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Saratov",
  hour: "2-digit",
  minute: "2-digit"
});

export function TodayPage() {
  const [page, setPage] = useState(1);
  const { currentData: data, isFetching, isError } = useListCardsQuery(
    { todayOnly: true, page, pageSize: 50 },
    { pollingInterval: 60_000, refetchOnMountOrArgChange: true }
  );
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 50));

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
        {isError ? <div className="error-state surface">Не удалось загрузить карточки.</div> : null}
        {isFetching ? <div className="muted-state">Обновляю данные...</div> : null}
        {data?.items.length === 0 ? (
          <div className="empty-state surface">На сегодня нет карточек для повторения</div>
        ) : null}
        <div className="section">
          {data?.items.map((card) => (
            <article className="surface today-card" key={card.id}>
              <time dateTime={card.nextReviewAt}>{timeFormat.format(new Date(card.nextReviewAt))}</time>
              <div>
                <h2>{card.title}</h2>
                <p className="muted-state">Уровень {card.level + 1}: {card.levelLabel}</p>
                {card.tags.length > 0 ? (
                  <div className="tags-row">
                    {card.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                  </div>
                ) : null}
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
    </main>
  );
}
