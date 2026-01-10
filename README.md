# TODO Platform

Веб-приложение для управления задачами, командами и предметами.

## Структура проекта

- `client/` - React фронтенд приложение (Vite + TypeScript)
- `server/` - NestJS бэкенд приложение (TypeScript + PostgreSQL)
- `docs/` - Статические файлы для GitHub Pages

## Локальная разработка

### Требования

- Node.js (версия 18 или выше)
- PostgreSQL (версия 12 или выше)
- npm или yarn

### Настройка базы данных

1. Создайте базу данных PostgreSQL:
```bash
createdb todo_platform
```

2. Создайте файл `.env` в папке `server/`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/todo_platform
PORT=3000
JWT_SECRET=your-secret-key-here
```

Замените `username`, `password` и `JWT_SECRET` на ваши значения.

### Запуск сервера

1. Перейдите в папку сервера:
```bash
cd server
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер в режиме разработки:
```bash
npm run start:dev
```

Сервер будет доступен по адресу: `http://localhost:3000`

4. (Опционально) Заполните базу данных тестовыми данными:
```bash
npm run seed
```

Это создаст тестового пользователя:
- Email: `host@example.com`
- Пароль: `password123`
- Роль: `host` (преподаватель)

### Запуск клиента

1. Откройте новый терминал и перейдите в папку клиента:
```bash
cd client
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите клиент в режиме разработки:
```bash
npm run dev
```

Клиент будет доступен по адресу: `http://localhost:5173`

Vite автоматически откроет браузер с приложением.

## Использование

### Вход в систему

1. Откройте `http://localhost:5173` в браузере
2. Нажмите "Войти"
3. Используйте тестовые данные:
   - Email: `host@example.com`
   - Пароль: `password123`

### Основные функции

- **Главная страница** (`/#/`) - список предметов, команд и задач
- **Страница команды** (`/#/team/КОД`) - детали конкретной команды

### Навигация

Приложение использует HashRouter для работы на GitHub Pages:
- Главная: `/#/`
- Команда: `/#/team/ABC123` (где ABC123 - код команды)

## Сборка для production

### Клиент

```bash
cd client
npm run build
```

Собранные файлы будут в папке `docs/`, готовые для GitHub Pages.

### Сервер

```bash
cd server
npm run build
npm run start:prod
```

## Тестирование

### Запуск тестов сервера

```bash
cd server
npm test
```

### Проверка кода клиента

```bash
cd client
npm run lint
```

## Структура URL

- **Локально (dev)**: `http://localhost:5173/` (base = `/`)
- **Production (GitHub Pages)**: `https://username.github.io/todo_platform/` (base = `/todo_platform/`)

## Решение проблем

### Ошибка подключения к базе данных

Убедитесь, что:
- PostgreSQL запущен
- DATABASE_URL в `.env` указан правильно
- База данных создана

### Ошибка CORS

Сервер настроен на работу с локальным клиентом (`http://localhost:5173`). Если используете другой порт, обновите настройки CORS в `server/src/main.ts`.

### Клиент не может подключиться к API

Проверьте, что сервер запущен на порту 3000. URL API настроен в `client/src/api/axios.ts`:
- Development: `http://localhost:3000`
- Production: `https://todo-platform-449e.onrender.com`

## Технологии

### Клиент
- React 19
- TypeScript
- Vite
- React Router (HashRouter)
- Axios
- Tailwind CSS

### Сервер
- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- Passport JWT
- Bcrypt
