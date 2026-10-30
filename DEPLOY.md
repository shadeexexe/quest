# Как выложить сайт бесплатно

В среде, где собран проект, нет вашего аккаунта Vercel / Neon / GitHub.
Поэтому публикацию нужно сделать один раз в браузере — это занимает около 10 минут.
Всё бесплатно, банковская карта не нужна.

Рекомендуемая связка:

- **Vercel** — сам сайт (бесплатный тариф Hobby)
- **Neon** — база PostgreSQL для заявок (бесплатный тариф)

---

## Шаг 1. База данных на Neon

1. Откройте https://neon.tech и нажмите **Sign up**.
2. Войдите через Google или GitHub.
3. Create a project:
   - Name: `experimentariy-quest`
   - Region: ближайший (например Frankfurt / Warsaw)
4. После создания откройте **Dashboard → Connection details**.
5. Скопируйте строку **Connection string**. Она выглядит так:

   `postgresql://neondb_owner:xxxxx@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

   Это и есть `DATABASE_URL`. Сохраните её в блокнот.

6. Слева откройте **SQL Editor**.
7. Вставьте содержимое файла `src/db/init.sql` из этого проекта и нажмите **Run**.
8. Должно появиться: `CREATE TABLE`.

Готово: заявки будут храниться в облаке и не пропадут при перезапуске сайта.

---

## Шаг 2. Сайт на Vercel

### Вариант А. Через GitHub (удобнее на будущее)

1. Зарегистрируйтесь на https://github.com.
2. Нажмите **New repository**, имя например `harry-potter-quest`, **без** галочки README.
3. На своём компьютере в папке проекта:

   ```bash
   git init
   git add .
   git commit -m "Квест Гарри Поттер"
   git branch -M main
   git remote add origin https://github.com/ВАШ_ЛОГИН/harry-potter-quest.git
   git push -u origin main
   ```

   Файл `.env` в Git **не попадёт** (он в `.gitignore`).

4. Откройте https://vercel.com → **Sign up** через GitHub.
5. **Add New… → Project** → выберите репозиторий → **Import**.
6. **Environment Variables** — добавьте четыре строки **до** нажатия Deploy:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | строка из Neon |
   | `ADMIN_USERNAME` | `ExperementariumAdmin` |
   | `ADMIN_PASSWORD_HASH_B64` | `JDJiJDEwJEVsYWZLLnJaR01hQ2xnRjcvZ0prNmUyaXFyQkhKemtPOHpSZThIN1doazM5RmJmcXNxRFBP` |
   | `SESSION_SECRET` | любая длинная случайная фраза, например `anapa-quest-secret-2026-x7k` |

7. **Deploy**. Через 1–2 минуты появится адрес вида `https://что-то.vercel.app`.

### Вариант Б. Без GitHub, через компьютер

1. Установите Node.js с https://nodejs.org
2. В папке проекта:

   ```bash
   npm install
   npx vercel login
   npx vercel --prod
   ```

3. CLI спросит войти в браузере, затем попросит те же переменные окружения.
   Их также можно добавить потом: Vercel → Project → Settings → Environment Variables → Redeploy.

---

## Шаг 3. Проверка

1. Откройте выданный адрес Vercel — должна открыться страница квеста.
2. Отправьте тестовую заявку с формы.
3. Откройте `/admin`
   - логин: `ExperementariumAdmin`
   - пароль: `ExperementariumQuestGaggyPotter`
4. Заявка должна появиться в списке.
5. Нажмите **Скачать Excel**.

Если `/api/health` открывается и показывает `{"ok":true}` — база подключена.

---

## Что прислать мне, если хотите, чтобы я выложил сам

Мне нужны **два** значения (можно в чат):

1. `DATABASE_URL` из Neon (шаг 1).
2. Токен Vercel: https://vercel.com/account/tokens → Create → скопировать.

С ними можно запустить публикацию из этой среды. Без них войти в ваш аккаунт я не могу.

---

## Ограничения бесплатных тарифов

- **Vercel Hobby**: сайт не засыпает, лимит ~100 ГБ трафика в месяц — для записи на квест хватает. Домен `*.vercel.app` бесплатный. Свой домен можно подключить тоже бесплатно.
- **Neon Free**: база бессрочная. При простое может «засыпать» на несколько секунд — первая заявка после паузы откроется чуть дольше.
- **Render Free** (запасной вариант): сайт засыпает через 15 минут без посещений, первый заход занимает 30–50 секунд. Бесплатную базу Render со временем отключают — для заявок лучше Neon.
- Раз в месяц в админке нажимайте **Скачать Excel** — это ваша резервная копия заявок.

---

## Свой адрес вместо vercel.app

В Vercel: Project → Settings → Domains → добавьте домен.
Для бесплатного поддомена можно взять адрес на https://www.freenom.com или купить дешёвый `.ru` / `.site`.
После привязки в панели домена пропишите DNS, который покажет Vercel.
