import { EditCardDialog } from "../../../shared/ui/EditCardDialog";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "@radix-ui/themes";
import { CardForm } from "../../../features/card-form";
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
          <TextField.Root className="search-input" placeholder="Поиск" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {error ? <div className="error-state surface">{error}</div> : null}
        {isFetching ? <div className="muted-state">Обновляю данные...</div> : null}
        <CardsGrid cards={cards} onEdit={setEditingCard} onDelete={deleteCard} onReset={resetCard} />
        <div className="pagination">
          <span>
            Страница {page} из {totalPages}. Всего: {total}
          </span>
          <div className="pagination-actions">
            <Button className="secondary-button" disabled={page <= 1} onClick={() => setPage(page - 1)} type="button">
              Назад
            </Button>
            <Button className="secondary-button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} type="button">
              Вперёд
            </Button>
          </div>
        </div>
      </section>

      {editingCard ? (
        <EditCardDialog onClose={() => setEditingCard(null)}>
            <CardForm card={editingCard} submitLabel="Сохранить" onSubmit={updateCard} onCancel={() => setEditingCard(null)} />
        </EditCardDialog>
      ) : null}
    </main>
  );
}
