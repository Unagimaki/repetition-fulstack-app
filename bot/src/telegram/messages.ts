import { Markup } from "telegraf";
import type { InlineKeyboardButton } from "telegraf/types";
import { config } from "../config.js";
import type { Card } from "../backend/types.js";

export const reviewNowButton = "Повторить сейчас";

export function mainMenuKeyboard() {
  return Markup.keyboard([[reviewNowButton]]).resize();
}

export function dueMessage(count: number): string {
  return `Пора повторить карточки: ${count}`;
}

export function dueKeyboard() {
  const rows: InlineKeyboardButton[][] = [
    [Markup.button.callback("Повторять", "review:start")],
    [Markup.button.callback("Напомнить через 10 минут", "review:snooze")]
  ];

  if (isPublicUrl(config.PUBLIC_APP_URL)) {
    rows.push([Markup.button.url("Открыть приложение", config.PUBLIC_APP_URL)]);
  }

  return Markup.inlineKeyboard(rows);
}

export function cardQuestionMessage(card: Card): string {
  return [
    card.title,
    "",
    `Уровень: ${card.level + 1} - ${card.levelLabel}`
  ].join("\n");
}

export function cardAnswerMessage(card: Card): string {
  return [
    cardQuestionMessage(card),
    "",
    "Ответ",
    card.backText
  ].join("\n");
}

export function reviewKeyboard(card: Card) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Показать ответ", `review:show:${card.id}`)],
    [
      Markup.button.callback("Знаю", `review:answer:${card.id}:know`),
      Markup.button.callback("Не уверен", `review:answer:${card.id}:unsure`)
    ],
    [Markup.button.callback("Не знаю", `review:answer:${card.id}:dont_know`)],
    [
      Markup.button.callback("Сбросить уровень", `review:reset:${card.id}`),
      Markup.button.callback("Напомнить позже", "review:snooze")
    ]
  ]);
}

function isPublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname !== "localhost" && url.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}
