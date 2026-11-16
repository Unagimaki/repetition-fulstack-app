import { EditCardDialog } from "../../../shared/ui/EditCardDialog";
import { CardForm } from "../../../features/card-form";
import { ReviewCard } from "../../../features/review-card/ui/ReviewCard";
import { useHomeDashboard } from "../model/useHomeDashboard";

export function HomeDashboard() {
  const {
    currentCard,
    dueCardsCount,
    editingCard,
    error,
    isFetching,
    createCard,
    updateCard,
    reviewCard,
    resetCard,
    deleteCard,
    setEditingCard
  } = useHomeDashboard();

  return (
    <main className="page home-page">
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Новая теория</p>
            <h2>Создать карточку</h2>
          </div>
        </div>
        <CardForm onSubmit={createCard} />
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Очередь</p>
            <h2>Повторение сейчас</h2>
          </div>
          <span className="counter">{dueCardsCount}</span>
        </div>
        {error ? <div className="error-state surface">{error}</div> : null}
        {isFetching ? <div className="muted-state">Обновляю данные...</div> : null}
        {currentCard ? (
          <ReviewCard
            key={currentCard.id}
            card={currentCard}
            position={`1 из ${dueCardsCount}`}
            onReview={reviewCard}
            onReset={resetCard}
            onEdit={setEditingCard}
            onDelete={deleteCard}
          />
        ) : (
          <div className="empty-state surface">Сейчас нечего повторять</div>
        )}
      </section>

      {editingCard ? (
        <EditCardDialog onClose={() => setEditingCard(null)}>
            <CardForm card={editingCard} submitLabel="Сохранить" onSubmit={updateCard} onCancel={() => setEditingCard(null)} />
        </EditCardDialog>
      ) : null}
    </main>
  );
}
