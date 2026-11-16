import { TextField } from "@radix-ui/themes";
type Props = { value: string; onChange: (value: string) => void };

export function CardTitleField({ value, onChange }: Props) {
  return (
    <label>
      Заголовок
      <TextField.Root value={value} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}
