# AdRobot

Веб-интерфейс для управления кампаниями и потоками Keitaro. Фронтенд: React + TypeScript + Vite. API: FastAPI. Работа с данными: SQLAlchemy ORM + SQLite; версия схемы БД управляется Alembic. Docker Compose собирает приложение в один контейнер.

## Возможности

- Создание кампании, GEO-потока и потока выбранного оффера.
- Загрузка потоков кампании; потоки без офферов отображаются без интерактивных действий.
- Добавление и удаление офферов с черновым подтверждением или отменой.
- Пересчёт распределения трафика с учётом закреплённых весов.
- Локальный архив удалённых офферов и восстановление из него.
- Синхронизация с Keitaro с сохранением локальной истории.
- Список кампаний с поиском и постраничным выводом по 40 записей.

## Запуск

1. Создайте корневой `.env` со значениями:

   ```env
   KEITARO_HOST=https://your-keitaro-host
   KEITARO_API=your-admin-api-key
   ```

2. Запустите приложение из каталога проекта:

   ```sh
   docker compose up --build
   ```

3. Откройте [http://localhost:8000](http://localhost:8000).

Данные SQLite хранятся в Docker volume `adrobot-data`. Перед запуском FastAPI контейнер выполняет `alembic upgrade head`. Секреты из `.env` не включаются в образ и исключены из git.

## Миграции базы данных

В Docker миграции применяются автоматически при запуске контейнера. Для ручного применения:

```sh
docker compose exec adrobot alembic upgrade head
```

Для локальной разработки после установки зависимостей:

```sh
alembic upgrade head
```

Новая схема добавляется отдельным revision-файлом в `migrations/versions/`. Начальная миграция безопасно подхватывает существующую таблицу `offer_archive`, не удаляя архив.

## Структура

```text
app/
  main.py                    Сборка FastAPI и обработчики ошибок
  api/routes/                HTTP-маршруты кампаний, потоков и офферов
  services/                  Бизнес-сценарии Keitaro
  repositories/              SQLAlchemy-репозитории
  models.py                  ORM-модели
  database.py                Engine и фабрика сессий SQLAlchemy
  schemas.py                 Валидация входных данных API
  dependencies.py            Зависимости FastAPI
  keitaro.py                 Клиент Keitaro Admin API
  config.py                  Настройки из окружения
migrations/
  versions/                  Версионируемые миграции Alembic
alembic.ini                  Настройки Alembic
frontend/src/
  App.tsx                    Состояние навигации и выбор страницы
  pages/                     Контейнеры каталога, редактора и формы создания
  components/
    layout/                  Шапка, уведомления и подвал
    campaign-list/           Поиск, список кампаний и постраничная навигация
    campaign-creator/        Поля формы и настройки Keitaro
    editor/                  Карточки потоков и строки офферов
    Icon.tsx                 Общий набор SVG-иконок
    OfferSearch.tsx          Поиск офферов в Keitaro
  lib/api.ts                 Типизированный HTTP-клиент фронтенда
  types/                     Общие модели интерфейса
  styles.css                 Стили приложения
Dockerfile                   Сборка React и образ FastAPI
docker-compose.yml           Запуск приложения и хранилища SQLite
```

## Локальная разработка фронтенда

```sh
cd frontend
npm install
npm run dev
```

Production-сборка интерфейса:

```sh
npm run build
```
