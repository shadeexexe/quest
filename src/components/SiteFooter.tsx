import Link from "next/link";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { QUEST } from "@/lib/booking";

export default function SiteFooter() {
  return (
    <footer className="border-t border-gold/15 bg-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-lg tracking-[0.14em] text-parchment">ГАРРИ ПОТТЕР</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-parchment-dim/70">
              детский квест · Анапа
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-parchment-dim">
              Квест для детей 8–10 лет проводит интерактивный музей «Экспериментарий».
              Запись — по телефону или через форму на сайте.
            </p>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-gold/80">Музей</p>
            <ul className="space-y-3 text-sm text-parchment-dim">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold/70" strokeWidth={1.6} />
                <span>{QUEST.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold/70" strokeWidth={1.6} />
                <a href={QUEST.phoneHref} className="transition-colors hover:text-gold-soft">
                  {QUEST.phone}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-gold/80">Официальный сайт</p>
            <a
              href={QUEST.site}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-parchment-dim transition-colors hover:text-gold-soft"
            >
              experimentariy.ru
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.6} />
            </a>
            <p className="mt-4 text-xs leading-relaxed text-parchment-dim/60">
              Фотографии музея на этой странице взяты с официального сайта.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-parchment/10 pt-6 text-xs text-parchment-dim/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Музей «Экспериментарий» · Анапа</p>
          <p>Квест «Гарри Поттер» · запись по предварительной заявке</p>
        </div>
      </div>

      {/* Неприметная кнопка входа для администратора — левый нижний угол */}
      <Link
        href="/admin"
        aria-label="Вход для администратора"
        title="Для администратора"
        className="fixed bottom-3 left-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-parchment/15 bg-ink/70 text-parchment-dim/45 backdrop-blur-sm transition-all hover:border-gold/50 hover:text-gold-soft focus-visible:border-gold/60 focus-visible:text-gold-soft sm:bottom-4 sm:left-4"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <rect x="4" y="10" width="16" height="10" rx="1.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </Link>
    </footer>
  );
}
