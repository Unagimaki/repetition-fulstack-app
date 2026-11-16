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
docker compose up -d postgres
npm run dev:backend
npm run dev:client
npm run dev:bot
```

## Telegram-бот в Docker

Укажите `TELEGRAM_BOT_TOKEN`, `PUBLIC_APP_URL` и при необходимости
`BOT_POLL_INTERVAL_MS` в `.env`, затем запустите:

```bash
docker compose up -d --build bot
docker compose logs -f bot
```

Compose также запустит backend и PostgreSQL. Образ `repetition-backend:local`
должен быть собран заранее:

```bash
docker build -t repetition-backend:local ./backend
```

Бот обращается к API по адресу `http://backend:14000` внутри сети Compose.
`PUBLIC_APP_URL` — адрес клиентского приложения для ссылок в Telegram.
При запуске бота в Docker остановите его локальный процесс `npm run dev:bot`.

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
