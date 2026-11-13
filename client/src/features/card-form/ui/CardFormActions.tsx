type Props = { submitLabel: string; isSubmitting: boolean; onCancel?: () => void };

export function CardFormActions({ submitLabel, isSubmitting, onCancel }: Props) {
  return (
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
  );
}
