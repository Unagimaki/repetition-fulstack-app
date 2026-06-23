import { CardForm } from "../../../features/card-form/ui/CardForm";
import { CardsGrid } from "../../cards-grid/ui/CardsGrid";
import { useCardsCatalog } from "../model/useCardsCatalog";

export function CardsCatalog() {
  const {
    cards,
    page,
    total,
    totalPages,
    search,
    editingCard,
    error,
    isFetching,
    setSearch,
    setPage,
    setEditingCard,
    updateCard,
    deleteCard,
    resetCard
  } = useCardsCatalog();

  return (
    <main className="page">
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">База</p>
            <h1>Все карточки</h1>
          </div>
          <input className="search-input" placeholder="Поиск" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {error ? <div className="error-state surface">{error}</div> : null}
        {isFetching ? <div className="muted-state">Обновляю данные...</div> : null}
        <CardsGrid cards={cards} onEdit={setEditingCard} onDelete={deleteCard} onReset={resetCard} />
        <div className="pagination">
          <span>
            Страница {page} из {totalPages}. Всего: {total}
          </span>
          <div className="pagination-actions">
            <button className="secondary-button" disabled={page <= 1} onClick={() => setPage(page - 1)} type="button">
              Назад
            </button>
            <button className="secondary-button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} type="button">
              Вперёд
            </button>
          </div>
        </div>
      </section>

      {editingCard ? (
        <div className="modal-backdrop">
          <div className="modal surface">
            <h2>Редактировать карточку</h2>
            <CardForm card={editingCard} submitLabel="Сохранить" onSubmit={updateCard} onCancel={() => setEditingCard(null)} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
