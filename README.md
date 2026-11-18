# AdRobot

React + FastAPI веб-приложение для управления кампаниями и потоками Keitaro. Офферы можно добавлять и удалять через черновые изменения, закреплять их вес, архивировать и восстанавливать.

## Запуск

Создайте в корне проекта файл `.env`:

```env
KEITARO_HOST=https://your-keitaro-host
KEITARO_API=your-admin-api-key
```

Запустите приложение:

```sh
docker compose up --build -d
```

Откройте [http://localhost:8000](http://localhost:8000). SQLite хранится в Docker volume `adrobot-data`. Файл `.env` исключён из Git.

## Миграции

При старте контейнера миграции применяются автоматически командой `alembic upgrade head`. Чтобы запустить их вручную:

```sh
docker compose exec adrobot alembic upgrade head
```

Новые миграции добавляйте отдельными revision-файлами в `migrations/versions/`.
