# Платформа рейтинга активности для молодёжного парламента

Краткая инструкция по локальному запуску фронтенда, API и PostgreSQL-базы.

## Требования

- Node.js 20+
- npm 10+
- PostgreSQL 15+

## Запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
- `macOS / Linux`
```bash
cp .env.example .env
```
- `Windows cmd`
```bash
copy .env.example .env
```

3. Убедитесь, что PostgreSQL запущен и ссылка БД `DATABASE_URL` в `env.example`  существует.

Пример значения:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rating_platform"
CLIENT_URL="http://localhost:5173"
SERVER_HOST="127.0.0.1"
SERVER_PORT="3001"
```

4. Сгенерируйте Prisma client и примените миграции:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. При необходимости заполните базу тестовыми данными:

```bash
npm run prisma:seed
```

6. Запустите API:

```bash
npm run server
```

7. В отдельном терминале запустите фронтенд:

```bash
npm run dev
```

8. Откройте приложение:

```text
http://localhost:5173
```

## Что делает seed

- создаёт базовые роли и тестовые аккаунты
- создаёт 7 тестовых мероприятий
- создаёт 20 тестовых участников
- создаёт тестовые записи участия для демонстрации рейтинга и отчётов

## Тестовые данные

- Организатор: `org@example.com / 12345678`
- Пользователь: `user@example.com / 12345678`
- Наблюдатель: `hr@example.com / 12345678`

Также создаются 20 тестовых пользователей:

- `demo1@example.com / 12345678`
- `demo2@example.com / 12345678`
- `demo3@example.com / 12345678`
- `demo4@example.com / 12345678`
- `demo5@example.com / 12345678`
- `demo6@example.com / 12345678`
- `demo7@example.com / 12345678`
- `demo8@example.com / 12345678`
- `demo9@example.com / 12345678`
- `demo10@example.com / 12345678`
- `demo11@example.com / 12345678`
- `demo12@example.com / 12345678`
- `demo13@example.com / 12345678`
- `demo14@example.com / 12345678`
- `demo15@example.com / 12345678`
- `demo16@example.com / 12345678`
- `demo17@example.com / 12345678`
- `demo18@example.com / 12345678`
- `demo19@example.com / 12345678`
- `demo20@example.com / 12345678`
