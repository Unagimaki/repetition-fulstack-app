import type { ReactNode } from "react";

type Props = {
  text: string;
};

export function FormattedText({ text }: Props) {
  return <div className="formatted-text">{renderBlocks(text)}</div>;
}

function renderBlocks(text: string): ReactNode[] {
  const parts = text.split(/```/g);

  return parts.map((part, index) => {
    const key = `block-${index}`;
    if (index % 2 === 1) {
      return (
        <pre className="formatted-code-block" key={key}>
          <code>{part.trim()}</code>
        </pre>
      );
    }

    return (
      <div className="formatted-lines" key={key}>
        {part.split("\n").map((line, lineIndex) => (
          <p key={`${key}-line-${lineIndex}`}>{renderInline(line)}</p>
        ))}
      </div>
    );
  });
}

function renderInline(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes;
}
