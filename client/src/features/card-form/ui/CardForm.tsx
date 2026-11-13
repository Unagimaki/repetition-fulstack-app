import { useCardForm } from "../model/useCardForm";
import type { CardFormProps } from "../model/useCardForm";
import { CardTitleField } from "./CardTitleField";
import { CardTagsField } from "./CardTagsField";
import { CardAnswerField } from "./CardAnswerField";
import { CardFormActions } from "./CardFormActions";

export function CardForm({ card, submitLabel = "Создать", onSubmit, onCancel }: CardFormProps) {
  const form = useCardForm({ card, onSubmit });

  return (
    <form className="card-form surface" onSubmit={form.handleSubmit}>
      <div className="form-grid">
        <CardTitleField value={form.title} onChange={form.setTitle} />
        <CardTagsField
          selectedTags={form.selectedTags}
          tagDraft={form.tagDraft}
          tagOptions={form.tagOptions}
          onDraftChange={form.setTagDraft}
          onKeyDown={form.handleTagKeyDown}
          onAdd={form.addTag}
          onRemove={form.removeTag}
        />
      </div>
      <CardAnswerField value={form.backText} onChange={form.setBackText} />
      <CardFormActions submitLabel={submitLabel} isSubmitting={form.isSubmitting} onCancel={onCancel} />
    </form>
  );
}
