import { Button } from "../../../shared/ui/Button";
type Props = { submitLabel: string; isSubmitting: boolean; onCancel?: () => void };

export function CardFormActions({ submitLabel, isSubmitting, onCancel }: Props) {
  return (
    <div className="actions">
      <Button className="primary-button" disabled={isSubmitting} type="submit">
        {submitLabel}
      </Button>
      {onCancel ? (
        <Button className="ghost-button" onClick={onCancel} type="button">
          Отмена
        </Button>
      ) : null}
    </div>
  );
}
