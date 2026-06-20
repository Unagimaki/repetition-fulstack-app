import { FormEvent, useMemo, useState } from "react";
import type { Card, CardInput } from "../../../entities/card/model/types";

type Props = {
  card?: Card;
  submitLabel?: string;
  onSubmit: (input: CardInput) => Promise<void>;
  onCancel?: () => void;
};

export function CardForm({ card, submitLabel = "Создать", onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [backText, setBackText] = useState(card?.backText ?? "");
  const [tagsText, setTagsText] = useState(card?.tags.join(", ") ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tags = useMemo(
    () => tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tagsText]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ title, frontText: title, backText, tags });
      if (!card) {
        setTitle("");
        setBackText("");
        setTagsText("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card-form surface" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Заголовок
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          Теги
          <input placeholder="js, react, sql" value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
        </label>
      </div>
      <label>
        Ответ
        <textarea value={backText} onChange={(event) => setBackText(event.target.value)} required rows={6} />
      </label>
      <div className="actions">
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {submitLabel}
        </button>
        {onCancel ? (
          <button className="ghost-button" onClick={onCancel} type="button">
            Отмена
          </button>
        ) : null}
      </div>
    </form>
  );
}
