type Props = { value: string; onChange: (value: string) => void };

export function CardTitleField({ value, onChange }: Props) {
  return (
    <label>
      Заголовок
      <input value={value} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}
