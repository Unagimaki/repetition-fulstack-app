import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { useListTagsQuery } from "../../../entities/card/api/cardApi";
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
  const [selectedTags, setSelectedTags] = useState<string[]>(card?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: availableTags = [] } = useListTagsQuery();

  const tagOptions = useMemo(() => {
    const selected = new Set(selectedTags);
    return availableTags.filter((tag) => !selected.has(tag));
  }, [availableTags, selectedTags]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ title, frontText: title, backText, tags: selectedTags });
      if (!card) {
        setTitle("");
        setBackText("");
        setSelectedTags([]);
        setTagDraft("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function addTag(rawTag = tagDraft) {
    const tag = rawTag.trim().toLowerCase();
    if (!tag || selectedTags.includes(tag)) {
      setTagDraft("");
      return;
    }

    setSelectedTags((tags) => [...tags, tag]);
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setSelectedTags((tags) => tags.filter((item) => item !== tag));
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
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
          <div className="tag-editor">
            <div className="selected-tags">
              {selectedTags.map((tag) => (
                <button className="tag-chip" key={tag} onClick={() => removeTag(tag)} type="button">
                  {tag} ×
                </button>
              ))}
            </div>
            <div className="tag-input-row">
              <input
                list="card-tag-options"
                placeholder="Выбрать или создать тег"
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <button className="ghost-button" onClick={() => addTag()} type="button">
                Добавить
              </button>
            </div>
            <datalist id="card-tag-options">
              {tagOptions.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </div>
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
