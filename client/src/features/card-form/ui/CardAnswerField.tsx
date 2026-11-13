import { useId, useRef } from "react";

type Props = { value: string; onChange: (value: string) => void };

type FormatKind = "bold" | "italic" | "inlineCode" | "codeBlock";

export function CardAnswerField({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputId = useId();
  function applyFormat(kind: FormatKind) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const fallback = kind === "codeBlock" ? "код" : "текст";
    const formattedValue = selected || fallback;
    const [prefix, suffix] = formatWrap(kind);
    const nextText = `${value.slice(0, start)}${prefix}${formattedValue}${suffix}${value.slice(end)}`;

    onChange(nextText);
    requestAnimationFrame(() => {
      const nextStart = start + prefix.length;
      const nextEnd = nextStart + formattedValue.length;
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  return (
    <div className="form-field">
      <label htmlFor={inputId}>Ответ</label>
      <div className="format-toolbar" aria-label="Форматирование ответа">
        <button className="icon-button" title="Жирный" onClick={() => applyFormat("bold")} type="button">
          B
        </button>
        <button className="icon-button" title="Курсив" onClick={() => applyFormat("italic")} type="button">
          I
        </button>
        <button className="icon-button" title="Код в строке" onClick={() => applyFormat("inlineCode")} type="button">
          {"</>"}
        </button>
        <button className="secondary-button" onClick={() => applyFormat("codeBlock")} type="button">
          Блок кода
        </button>
      </div>
      <textarea id={inputId} ref={textareaRef} value={value} onChange={(event) => onChange(event.target.value)} required rows={6} />
    </div>
  );
}

function formatWrap(kind: FormatKind): [string, string] {
  if (kind === "bold") return ["**", "**"];
  if (kind === "italic") return ["*", "*"];
  if (kind === "inlineCode") return ["`", "`"];
  return ["\n```\n", "\n```\n"];
}
