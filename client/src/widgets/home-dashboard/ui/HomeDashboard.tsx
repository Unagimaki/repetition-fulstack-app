import { CardForm } from "../../../features/card-form/ui/CardForm";
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
    <main className="page">
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Новая теория</p>
            <h1>Создать карточку</h1>
          </div>
        </div>
        <CardForm onSubmit={createCard} />
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Очередь</p>
            <h1>Повторение сейчас</h1>
          </div>
          <span className="counter">{dueCardsCount}</span>
        </div>
        {error ? <div className="error-state surface">{error}</div> : null}
        {isFetching ? <div className="muted-state">Обновляю данные...</div> : null}
        {currentCard ? (
          <ReviewCard
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
