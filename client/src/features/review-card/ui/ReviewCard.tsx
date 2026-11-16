import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "@radix-ui/themes";
import { useState } from "react";
import type { Card, ReviewResult } from "../../../entities/card/model/types";
import { FormattedText } from "../../../shared/api/FormattedText";

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
        <Button className="icon-button" title="Редактировать" onClick={() => onEdit(card)} type="button"><Pencil size={15} aria-hidden="true" /></Button>
        <Button className="icon-button" title="Сбросить уровень" onClick={() => onReset(card.id)} type="button"><RotateCcw size={15} aria-hidden="true" /></Button>
        <Button className="icon-button danger" title="Удалить" onClick={() => onDelete(card.id)} type="button"><Trash2 size={15} aria-hidden="true" /></Button>
      </div>

      <div className="card-meta">
        <span>{position}</span>
        <span>Уровень {card.level + 1}: {card.levelLabel}</span>
      </div>

      {card.tags.length > 0 ? (
        <div className="tags-row" aria-label="Теги карточки">
          {card.tags.map((tag) => (
            <Badge className="tag" color="gray" variant="soft" key={tag}>
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className={isAnswerVisible ? "flip-card flipped" : "flip-card"}>
        <div className="flip-face flip-front">
          <h2>{card.title}</h2>
        </div>
        <div className="flip-face flip-back">
          <div className="answer-text">
            <FormattedText text={card.backText} />
          </div>
        </div>
      </div>

      <Button className="ghost-button fit" onClick={() => setAnswerVisible((value) => !value)} type="button">
        {isAnswerVisible ? "Скрыть ответ" : "Показать ответ"}
      </Button>

      <div className="review-actions">
        <Button className="primary-button" onClick={() => onReview(card.id, "know")} type="button">
          Знаю
        </Button>
        <Button className="secondary-button" onClick={() => onReview(card.id, "unsure")} type="button">
          Не уверен
        </Button>
        <Button className="danger-soft-button" onClick={() => onReview(card.id, "dont_know")} type="button">
          Не знаю
        </Button>
      </div>
    </article>
  );
}
