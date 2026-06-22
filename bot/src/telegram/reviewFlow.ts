import type { Context, Telegraf } from "telegraf";
import type { BackendClient } from "../backend/backendClient.js";
import {
  cardAnswerMessage,
  cardQuestionMessage,
  dueKeyboard,
  dueMessage,
  mainMenuKeyboard,
  reviewKeyboard,
  reviewNowButton
} from "./messages.js";

type PollingMeta = {
  reason: "initial" | "interval";
  tick: number;
};

export function registerReviewFlow(bot: Telegraf, backend: BackendClient) {
  bot.start(async (ctx) => {
    await backend.registerChat(String(ctx.chat.id));
    await ctx.reply("Готов присылать уведомления о повторении.", mainMenuKeyboard());
  });

  bot.command("due", async (ctx) => {
    await showNextDueCard(ctx, backend, false);
  });

  bot.hears(reviewNowButton, async (ctx) => {
    await showNextDueCard(ctx, backend, false);
  });

  bot.action("review:start", async (ctx) => {
    await ctx.answerCbQuery();
    await showNextDueCard(ctx, backend, true);
  });

  bot.action("review:snooze", async (ctx) => {
    await ctx.answerCbQuery();
    const count = await backend.snooze();
    await editOrReply(ctx, `Отложено на 10 минут: ${count}`);
  });

  bot.action(/^review:show:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const due = await backend.getDueCard();
    if (!due.card) {
      await editOrReply(ctx, "Карточек к повторению сейчас нет.");
      return;
    }
    await ctx.editMessageText(cardAnswerMessage(due.card), reviewKeyboard(due.card));
  });

  bot.action(/^review:answer:([^:]+):(know|unsure|dont_know)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const [, cardId, result] = ctx.match;
    await backend.review(cardId, result as "know" | "unsure" | "dont_know");
    await showNextDueCard(ctx, backend, true);
  });

  bot.action(/^review:reset:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const [, cardId] = ctx.match;
    await backend.reset(cardId);
    await showNextDueCard(ctx, backend, true);
  });
}

export async function notifyIfDue(bot: Telegraf, backend: BackendClient, meta: PollingMeta) {
  const chatId = await backend.getChatId();
  if (!chatId) {
    console.log(`[bot] polling #${meta.tick}: чат не подключен, уведомлять некого`);
    return;
  }

  const count = await backend.getNotificationDueCount();
  if (count === 0) {
    console.log(`[bot] polling #${meta.tick}: новых карточек для уведомления нет`);
    return;
  }

  console.log(`[bot] polling #${meta.tick}: найдены новые карточки для повтора, count=${count}`);
  await bot.telegram.sendMessage(chatId, dueMessage(count), dueKeyboard());
  const markedCount = await backend.markDueForNotification();
  console.log(`[bot] polling #${meta.tick}: уведомление отправлено, помечено карточек=${markedCount}`);
}

async function showNextDueCard(ctx: Context, backend: BackendClient, edit: boolean) {
  const due = await backend.getDueCard();
  if (!due.card) {
    await editOrReply(ctx, "Готово, карточек к повторению сейчас нет.");
    return;
  }

  const message = cardQuestionMessage(due.card);
  const keyboard = reviewKeyboard(due.card);
  if (edit) {
    await ctx.editMessageText(message, keyboard);
    return;
  }
  await ctx.reply(message, keyboard);
}

async function editOrReply(ctx: Context, message: string) {
  try {
    await ctx.editMessageText(message);
  } catch {
    await ctx.reply(message);
  }
}
