# Почему не работал раздел My Account и что исправлено

## Причина
В собранном сайте (тестовый стенд на Cloudflare Pages) не было публичных переменных
`VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`: файла `public.env` в репозитории нет, а в настройках
сборки этих переменных тоже нет. Из-за этого браузерный клиент Supabase не создавался, и страница
`/account` всегда показывала «My Account is not available yet»: не было ни поля для почты, ни ссылки
для входа. Серверная часть (`/api/*`) при этом подключена к Supabase и работает.

## Что исправлено
1. **Вход по ссылке работает без переменных сборки.** Браузер сначала берёт `VITE_SUPABASE_*` из сборки,
   а если их нет, запрашивает `GET /api/public-config` у сервера. Сервер отдаёт только публичные значения
   (URL и anon-ключ), service-ключ никогда не отдаётся.
2. **Понятные ошибки ссылки.** Если ссылка просрочена или уже использована, пользователь видит пояснение
   и может сразу запросить новую.
3. **Приветствие после входа.** Блок «Welcome, Имя!» с благодарностью за то, что человек стал нашим клиентом.
4. **Промокод только после платной покупки.** Бесплатные файлы (выданные по коду `TEST100`, receipt `free_…`)
   промокод не открывают: ни в аккаунте, ни в окне оформления заказа. Сервер тоже считает только платные покупки.
5. Список покупок со ссылками на товары, лицензионным ключом, кнопкой **Download ZIP** и звёздами →
   короткий отзыв → отзыв публикуется на странице товара с меткой *Verified buyer* (эта часть уже была в коде
   и теперь заработала, потому что вход работает).
6. Добавлены `.env.example` и `.gitignore`; файл `framehaus-v11.zip` из корня репозитория в архив не включён.

## Что нужно сделать вам (один раз)
1. **Cloudflare Pages → Settings → Variables and Secrets** (Production и Preview): добавьте
   `SUPABASE_ANON_KEY` = anon / publishable key из Supabase → Project Settings → API.
   Это публичный ключ (не service_role). Как вариант, можно задать `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
   как переменные сборки.
2. **Supabase → Authentication → URL Configuration:**
   - Site URL: ваш основной домен (например `https://nuovamotion.com`);
   - Redirect URLs: `https://<ваш-домен>/**` и для превью-деплоев `https://*.nuovamotion.pages.dev/**`.
   Без этого Supabase отправит человека на Site URL вместо `/account` тестового сайта.
3. **Supabase → Authentication → Email Templates → Magic Link:** в письме должна быть ссылка
   `{{ .ConfirmationURL }}` (в стандартном шаблоне она есть). Раньше README советовал `{{ .Token }}`
   (6-значный код), но сейчас вход идёт по ссылке.
4. Для реальной рассылки писем лучше подключить свой SMTP (Supabase → Authentication → SMTP Settings),
   потому что у встроенного почтового сервиса Supabase очень низкий лимит писем в час.
5. Если таблица `reviews` ещё не создана, выполните `supabase/schema.sql` в SQL Editor (скрипт идемпотентный).

## Изменённые файлы
- `src/lib/supabase.ts` — загрузка конфигурации во время работы, `loadSupabase()`, `useSupabase()`, `isFreePurchase`, ошибки ссылки
- `src/server/handlers/publicConfig.ts` (новый), `src/server/index.ts` — маршрут `/api/public-config`
- `src/server/promo.ts`, `src/server/supabaseAdmin.ts`, `src/server/handlers/claimDownload.ts`, `claimFree.ts` — промокод только за платные покупки
- `src/pages/Account.tsx` — приветствие, промокод для платных покупателей, метка бесплатных файлов
- `src/components/AuthForm.tsx`, `RateProject.tsx`, `CheckoutModal.tsx` — новый способ получения клиента
- `src/styles/global.css` — стили блока приветствия
- `README.md`, `AGENTS.md`, `.env.example`, `.gitignore`
