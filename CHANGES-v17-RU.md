# Изменения v17 (Nuovo Motion)

1. **Название и логотип.** «Framehaus» заменён на **Nuovo Motion** на всех страницах: шапка, подвал, заголовки вкладок,
   страница About, аккаунт, автор товаров. Новый знак — лаймовая плитка с наклонной буквой «N» (`src/components/Logo.tsx`),
   тот же рисунок в `public/favicon.svg`. В подвале указан будущий домен nuovomotion.com.
2. **Жёлтая полоса на превью убрана** со всех карточек (главная, каталог, аккаунт). На странице товара остаётся
   полоса-перемотка плеера (её можно тянуть).
3. **Сноска о налоге** под ценой: на карточках и в окне оформления — «+ your country's tax», на странице товара —
   «Plus applicable tax (VAT / sales tax) of your country.»
4. **Кнопка Buy now** больше не повторяет цену.
5. **Меню Shop** (и мобильное меню, и панель навигации) стало плотным тёмным, пункты — ярче, заголовки колонок — лаймовые.
6. **Значки AE / PR / PL / DR / LT / SFX** на превью и на странице товара при наведении раскрываются в полное название
   (After Effects, Premiere Pro, Plugins & Scripts…). Клик по значку на карточке по-прежнему открывает товар.
7. **Текст на главной** без количества проектов: «A small, carefully curated collection: every project, pack and tool is
   hand-picked for quality, not quantity. Made by independent motion designers. Buy once, use forever.»

Внутренние ключи localStorage (`fh_…`) и `name` в `wrangler.toml` не менялись, чтобы не сбросить сохранённые промокоды
и не сломать деплой на Cloudflare Pages.
