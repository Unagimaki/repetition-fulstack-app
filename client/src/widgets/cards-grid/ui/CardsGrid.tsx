import { useState } from "react";
import type { Card } from "../../../entities/card/model/types";
import { FormattedText } from "../../../shared/api/FormattedText";

type Props = {
  cards: Card[];
  onEdit: (card: Card) => void;
  onDelete: (id: string) => Promise<void>;
  onReset: (id: string) => Promise<void>;
};

export function CardsGrid({ cards, onEdit, onDelete, onReset }: Props) {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  if (cards.length === 0) {
    return <div className="empty-state surface">Карточек пока нет</div>;
  }

  return (
    <div className="cards-grid">
      {cards.map((card) => {
        const isFlipped = Boolean(flippedCards[card.id]);

        return (
          <article className="tile-card surface" key={card.id}>
            <div className="card-tools">
              <button className="icon-button" title="Редактировать" onClick={() => onEdit(card)} type="button">
                ✎
              </button>
              <button className="icon-button" title="Сбросить уровень" onClick={() => onReset(card.id)} type="button">
                ↺
              </button>
              <button className="icon-button danger" title="Удалить" onClick={() => onDelete(card.id)} type="button">
                ×
              </button>
            </div>

            <div className={isFlipped ? "tile-flip-card flipped" : "tile-flip-card"}>
              <div className="tile-face tile-face-front">
                <h3>{card.title}</h3>
                <div className="tile-details">
                  <span>
                    Уровень {card.level + 1}: {card.levelLabel}
                  </span>
                  <span>Повторить: {formatDate(card.nextReviewAt)}</span>
                </div>
                <div className="tags-row">
                  {card.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="tile-face tile-face-back">
                <div className="tile-answer-text">
                  <FormattedText text={card.backText} />
                </div>
              </div>
            </div>

            <button
              className="ghost-button fit"
              onClick={() => setFlippedCards((state) => ({ ...state, [card.id]: !state[card.id] }))}
              type="button"
            >
              {isFlipped ? "Скрыть ответ" : "Показать ответ"}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
