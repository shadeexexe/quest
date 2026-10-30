"use client";

import { useEffect, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";

const NAV = [
  { href: "#about", label: "О квесте" },
  { href: "#conditions", label: "Условия" },
  { href: "#museum", label: "Музей" },
  { href: "#booking", label: "Запись" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-ink/92 backdrop-blur-md border-b border-gold/20 py-2"
          : "bg-transparent py-3 sm:py-4"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3 group" aria-label="В начало страницы">
          <span className="relative flex h-9 w-9 items-center justify-center border border-gold/45 bg-wine/40">
            <Sparkles className="h-4 w-4 text-gold-soft" strokeWidth={1.5} />
            <span className="absolute inset-1 border border-gold/15" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[15px] sm:text-base tracking-[0.16em] text-parchment">
              ГАРРИ ПОТТЕР
            </span>
            <span className="block text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-parchment-dim/70">
              квест · Анапа
            </span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-[13px] tracking-wide text-parchment-dim">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-gold-soft"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#booking"
            className="btn-gold hidden sm:inline-flex px-5 py-2.5 text-[13px] tracking-wide"
          >
            Записаться
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center border border-parchment/25 text-parchment"
            aria-label="Открыть меню"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-ink/98 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gold/15">
            <span className="font-display tracking-[0.16em] text-parchment">ГАРРИ ПОТТЕР</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center border border-parchment/25 text-parchment"
              aria-label="Закрыть меню"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex flex-col px-4 py-6 gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-4 border-b border-parchment/10 font-display text-xl text-parchment active:text-gold-soft"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto px-4 pb-8">
            <a
              href="#booking"
              onClick={() => setOpen(false)}
              className="btn-gold w-full px-6 py-4 text-base"
            >
              Записаться на квест
            </a>
            <p className="mt-4 text-center text-xs text-parchment-dim/70">
              Музей «Экспериментарий» · Анапа
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
