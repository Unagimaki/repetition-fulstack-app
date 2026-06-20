# Repetition App

Минималистичное приложение для интервального повторения теории.

Карточки хранятся в PostgreSQL, клиент и Telegram-бот работают через единый backend, поэтому состояние повторений синхронизировано везде.

## Что внутри

- `client` - React/Vite, FSD, Redux Toolkit + RTK Query, React Router.
- `backend` - Go API с DDD-разделением на domain, application, infrastructure и HTTP layer.
- `bot` - Telegram-бот, который раз в минуту проверяет карточки к повторению и присылает уведомления.
- `docker-compose.yml` - локальный PostgreSQL.

## Возможности

- создание, редактирование и удаление карточек;
- импорт старых карточек из JSON/localStorage;
- интервалы повторения от 2 минут до 30 дней;
- ответы `Знаю`, `Не уверен`, `Не знаю`;
- сброс уровня карточки;
- страница всех карточек с поиском;
- Telegram-уведомления и повторение прямо в боте.

## Локальный запуск

```bash
cp .env.example .env
npm install
docker compose up -d
npm run dev:backend
npm run dev:client
npm run dev:bot
```

Локальные адреса:

- client: `http://localhost:15173`
- backend: `http://localhost:14000`
- postgres: `localhost:55432`

## Импорт старых карточек

Экспорт из старого приложения:

```js
copy(localStorage.getItem("sr_state_v1"))
```

Сохрани результат в JSON-файл и запусти:

```bash
node ./scripts/import-learn-app.mjs ./learn-export.json
```

Импорт использует upsert по `id`, поэтому повторный запуск не создает дубли.
