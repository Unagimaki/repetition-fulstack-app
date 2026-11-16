import { Button } from "../../../shared/ui/Button";
import { TextField } from "@radix-ui/themes";
import { useId } from "react";
import type { KeyboardEventHandler } from "react";

type Props = {
  selectedTags: string[];
  tagDraft: string;
  tagOptions: string[];
  onDraftChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onAdd: () => void;
  onRemove: (tag: string) => void;
};

export function CardTagsField({ selectedTags, tagDraft, tagOptions, onDraftChange, onKeyDown, onAdd, onRemove }: Props) {
  const optionsId = useId();
  const inputId = useId();
  return (
    <div className="form-field">
      <label htmlFor={inputId}>Теги</label>
      <div className="tag-editor">
        <div className="selected-tags">
          {selectedTags.map((tag) => (
            <Button className="tag-chip" key={tag} onClick={() => onRemove(tag)} type="button">
              {tag} ×
            </Button>
          ))}
        </div>
        <div className="tag-input-row">
          <TextField.Root
            id={inputId}
            list={optionsId}
            placeholder="Выбрать или создать тег"
            value={tagDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <Button className="ghost-button" onClick={() => onAdd()} type="button">
            Добавить
          </Button>
        </div>
        <datalist id={optionsId}>
          {tagOptions.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
