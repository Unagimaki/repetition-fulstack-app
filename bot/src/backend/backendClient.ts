import { config } from "../config.js";
import type { Card, ReviewResult, TelegramDueResponse } from "./types.js";

type RequestMeta = {
  method: string;
  path: string;
  url: string;
};

export class BackendRequestError extends Error {
  constructor(
    message: string,
    readonly meta: RequestMeta,
    readonly status?: number,
    readonly payload?: unknown,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "BackendRequestError";
  }
}

export class BackendClient {
  async registerChat(chatId: string): Promise<void> {
    await this.request("/api/telegram/start", {
      method: "POST",
      body: JSON.stringify({ chatId })
    });
  }

  async getChatId(): Promise<string | null> {
    const response = await this.request<{ chatId: string }>("/api/telegram/chat");
    return response.chatId || null;
  }

  async markDueForNotification(): Promise<number> {
    const response = await this.request<{ count: number }>("/api/telegram/notify-due", {
      method: "POST"
    });
    return response.count;
  }

  async getNotificationDueCount(): Promise<number> {
    try {
      const response = await this.request<{ count: number }>("/api/telegram/notification-due");
      return response.count;
    } catch (error) {
      if (error instanceof BackendRequestError && error.status === 404) {
        console.warn("[bot] backend: route /api/telegram/notification-due missing, using fallback /api/telegram/due");
        const due = await this.getDueCard();
        return due.card ? 1 : 0;
      }
      throw error;
    }
  }

  async getDueCard(): Promise<TelegramDueResponse> {
    return this.request<TelegramDueResponse>("/api/telegram/due");
  }

  async review(cardId: string, result: ReviewResult): Promise<Card> {
    return this.request<Card>(`/api/cards/${cardId}/review`, {
      method: "POST",
      body: JSON.stringify({ result })
    });
  }

  async reset(cardId: string): Promise<Card> {
    return this.request<Card>(`/api/cards/${cardId}/reset`, {
      method: "POST"
    });
  }

  async snooze(): Promise<number> {
    const response = await this.request<{ count: number }>("/api/telegram/snooze", {
      method: "POST"
    });
    return response.count;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const meta = {
      method: options.method ?? "GET",
      path,
      url: `${config.BACKEND_API_URL}${path}`
    };

    let response: Response;
    try {
      response = await fetch(meta.url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers
        }
      });
    } catch (error) {
      throw new BackendRequestError(
        `backend недоступен: ${meta.method} ${meta.path}`,
        meta,
        undefined,
        undefined,
        error
      );
    }

    const text = await response.text();
    const payload = parsePayload(text);

    if (!response.ok) {
      throw new BackendRequestError(
        `backend вернул ${response.status}: ${meta.method} ${meta.path}`,
        meta,
        response.status,
        payload
      );
    }

    return payload as T;
  }
}

export function formatBackendError(error: unknown): string {
  if (!(error instanceof BackendRequestError)) {
    return error instanceof Error ? error.message : String(error);
  }

  if (!error.status) {
    return `${error.message}; проверь, что backend запущен на ${config.BACKEND_API_URL}`;
  }

  if (error.status === 404) {
    return `${error.message}; endpoint не найден, перезапусти backend`;
  }

  if (error.status >= 500) {
    return `${error.message}; смотри лог backend`;
  }

  return error.message;
}

function parsePayload(text: string): unknown {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
