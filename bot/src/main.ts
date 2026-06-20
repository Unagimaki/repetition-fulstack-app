import { Telegraf } from "telegraf";
import { BackendClient, formatBackendError } from "./backend/backendClient.js";
import { config } from "./config.js";
import { notifyIfDue, registerReviewFlow } from "./telegram/reviewFlow.js";

const backend = new BackendClient();
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

let pollingTick = 0;
let isNotificationPolling = false;
let interval: ReturnType<typeof setInterval>;

registerReviewFlow(bot, backend);
startNotificationScheduler();
configureBotCommands();
launchBot();

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

function startNotificationScheduler() {
  console.log(`[bot] polling: started, interval ${config.BOT_POLL_INTERVAL_MS}ms, backend ${config.BACKEND_API_URL}`);

  runNotificationPolling("initial");
  interval = setInterval(() => {
    runNotificationPolling("interval");
  }, config.BOT_POLL_INTERVAL_MS);
}

function runNotificationPolling(reason: "initial" | "interval") {
  if (isNotificationPolling) {
    console.log("[bot] polling: skipped, previous tick still running");
    return;
  }

  pollingTick += 1;
  isNotificationPolling = true;

  notifyIfDue(bot, backend, { reason, tick: pollingTick })
    .catch((error) => {
      console.error(`[bot] polling: error, ${formatBackendError(error)}`);
    })
    .finally(() => {
      isNotificationPolling = false;
    });
}

function configureBotCommands() {
  bot.telegram
    .setMyCommands([
      { command: "start", description: "Подключить уведомления" },
      { command: "due", description: "Повторить сейчас" }
    ])
    .then(() => {
      console.log("[bot] telegram: commands configured");
    })
    .catch((error) => {
      console.error(`[bot] telegram: commands error, ${error instanceof Error ? error.message : String(error)}`);
    });
}

function launchBot() {
  bot
    .launch()
    .then(() => {
      console.log("[bot] telegram: started");
    })
    .catch((error) => {
      console.error(`[bot] telegram: launch error, ${error instanceof Error ? error.message : String(error)}`);
    });

  bot.catch((error) => {
    console.error(`[bot] telegram: handler error, ${error instanceof Error ? error.message : String(error)}`);
  });
}

function shutdown(signal: "SIGINT" | "SIGTERM") {
  clearInterval(interval);
  bot.stop(signal);
}
