import { Button } from "../../../shared/ui/Button";
import { useListTagsQuery } from "../../../entities/card/api/cardApi";

const levels = ["2 минуты", "10 минут", "1 час", "6 часов", "Следующий день", "3 дня", "7 дней", "14 дней", "30 дней"];

type Props = {
  tag: string;
  level: string;
  onChange: (tag: string, level: string) => void;
};

export function TodayFilters({ tag, level, onChange }: Props) {
  const { data: tags = [], isError, refetch } = useListTagsQuery();

  return (
    <div className="today-filters">
      <label>
        Тег
        <select value={tag} onChange={(event) => onChange(event.target.value, level)}>
          <option value="">Все теги</option>
          {tags.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        Уровень повторения
        <select value={level} onChange={(event) => onChange(tag, event.target.value)}>
          <option value="">Все уровни</option>
          {levels.map((label, index) => <option value={index} key={index}>Уровень {index + 1}: {label}</option>)}
        </select>
      </label>
      <Button className="ghost-button" disabled={!tag && !level} onClick={() => onChange("", "")} type="button">Сбросить фильтры</Button>
      {isError ? <Button className="ghost-button" onClick={() => refetch()} type="button">Не удалось загрузить теги. Повторить</Button> : null}
    </div>
  );
}
