import { useState } from "react";
import type { Card, ReviewResult } from "../../../entities/card/model/types";

type Props = {
  card: Card;
  position: string;
  onReview: (id: string, result: ReviewResult) => Promise<void>;
  onReset: (id: string) => Promise<void>;
  onEdit: (card: Card) => void;
  onDelete: (id: string) => Promise<void>;
};

export function ReviewCard({ card, position, onReview, onReset, onEdit, onDelete }: Props) {
  const [isAnswerVisible, setAnswerVisible] = useState(false);

  return (
    <article className="review-card">
      <div className="card-tools" aria-label="Действия с карточкой">
        <button className="icon-button" title="Редактировать" onClick={() => onEdit(card)} type="button">✎</button>
        <button className="icon-button" title="Сбросить уровень" onClick={() => onReset(card.id)} type="button">↺</button>
        <button className="icon-button danger" title="Удалить" onClick={() => onDelete(card.id)} type="button">×</button>
      </div>

      <div className="card-meta">
        <span>{position}</span>
        <span>Уровень {card.level + 1}: {card.levelLabel}</span>
      </div>

      <div className={isAnswerVisible ? "flip-card flipped" : "flip-card"}>
        <div className="flip-face flip-front">
          <h2>{card.title}</h2>
        </div>
        <div className="flip-face flip-back">
          <h2>{card.title}</h2>
          <div className="answer-text">{card.backText}</div>
        </div>
      </div>

      <button className="ghost-button fit" onClick={() => setAnswerVisible((value) => !value)} type="button">
        {isAnswerVisible ? "Скрыть ответ" : "Показать ответ"}
      </button>

      <div className="review-actions">
        <button className="primary-button" onClick={() => onReview(card.id, "know")} type="button">
          Знаю
        </button>
        <button className="secondary-button" onClick={() => onReview(card.id, "unsure")} type="button">
          Не уверен
        </button>
        <button className="danger-soft-button" onClick={() => onReview(card.id, "dont_know")} type="button">
          Не знаю
        </button>
      </div>
    </article>
  );
}
