# Изучение художников

Веб-приложение для изучения русских и итальянских художников в игровом формате.

## Структура проекта

- `client/` — React + Vite + TypeScript фронтенд
- `server/` — Node.js WebSocket сервер для режима дуэли

## Локальный запуск

### Клиент

```bash
cd client
npm install
npm run dev
```

### Сервер дуэлей

```bash
cd server
npm install
npm start
```

## Деплой

### Фронтенд (Vercel)

1. Подключите GitHub репозиторий к Vercel
2. Укажите `client/` как Root Directory
3. Framework Preset: Vite
4. Добавьте Environment Variable `VITE_WS_URL` — URL вашего WebSocket сервера

### Сервер дуэлей (Render / Railway)

1. Добавьте `server/` как отдельный сервис
2. Build Command: `npm install`
3. Start Command: `node index.js`
4. Укажите переменную окружения `PORT` (Render назначает автоматически)

## Функционал

- 📅 Автоматическая смена художника каждую неделю (с 13 мая 2025)
- 📚 Биография, галерея и стиль каждого художника
- 🧩 3 типа заданий: угадай картину, верно/неверно, угадай по стилю
- ⚔️ Режим дуэли через WebSocket в реальном времени
- 🏆 Прогресс двух пользователей (Александр и Дарья)
- 🎉 Анимации и звуковые эффекты

## Технологии

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Framer Motion
- Zustand
- canvas-confetti
- WebSocket (ws)
