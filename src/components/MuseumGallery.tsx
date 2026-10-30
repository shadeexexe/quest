"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Reveal from "@/components/Reveal";
import { QUEST } from "@/lib/booking";

const PHOTOS = [
  { src: "/images/museum/museum-1.jpg", alt: "Зал музея «Экспериментарий» в Анапе" },
  { src: "/images/museum/museum-2.jpg", alt: "Экспозиция музея «Экспериментарий» в Анапе" },
  { src: "/images/museum/museum-3.jpg", alt: "Интерактивные экспонаты музея «Экспериментарий»" },
];

export default function MuseumGallery() {
  const [active, setActive] = useState<number | null>(null);

  const close = () => setActive(null);
  const step = (dir: number) => {
    setActive((current) => {
      if (current === null) return current;
      return (current + dir + PHOTOS.length) % PHOTOS.length;
    });
  };

  return (
    <section id="museum" className="relative border-t border-gold/12 bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-gold/70" />
                <span className="eyebrow">Музей</span>
              </div>
              <h2 className="font-display text-3xl leading-tight text-parchment sm:text-4xl">
                Где проходит квест
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-parchment-dim">
              Залы музея «Экспериментарий» в Анапе. Кадры самой игры не публикуем, чтобы не
              раскрывать задания.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {PHOTOS.map((photo, index) => (
            <Reveal key={photo.src} delay={index * 80}>
              <button
                type="button"
                onClick={() => setActive(index)}
                className="photo-frame group block w-full cursor-pointer text-left"
                aria-label="Открыть фотографию музея"
              >
                <div className="relative aspect-[4/3] w-full sm:aspect-[3/4]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                  <span className="absolute bottom-3 left-4 font-display text-xs tracking-[0.2em] text-gold-soft/90">
                    0{index + 1}
                  </span>
                  <span className="absolute bottom-3 right-4 text-[11px] uppercase tracking-[0.18em] text-parchment/70">
                    Анапа
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="mt-6 flex flex-col gap-2 text-xs text-parchment-dim/70 sm:flex-row sm:items-center sm:justify-between">
            <p>Фотографии — с официального сайта музея «Экспериментарий».</p>
            <a
              href={QUEST.site}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-gold-soft/85 transition-colors hover:text-gold-soft"
            >
              experimentariy.ru
              <ExternalLink className="h-3 w-3" strokeWidth={1.8} />
            </a>
          </div>
        </Reveal>
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center border border-parchment/25 text-parchment transition-colors hover:border-gold/60 hover:text-gold-soft"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
            className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-parchment/25 text-parchment transition-colors hover:border-gold/60 hover:text-gold-soft sm:left-6"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
            className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-parchment/25 text-parchment transition-colors hover:border-gold/60 hover:text-gold-soft sm:right-6"
            aria-label="Следующее фото"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div
            className="relative w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[4/3] w-full border border-gold/25 bg-ink-soft">
              <Image
                src={PHOTOS[active].src}
                alt={PHOTOS[active].alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <p className="mt-3 text-center text-xs text-parchment-dim/80">
              Музей «Экспериментарий» · Анапа · фото {active + 1} из {PHOTOS.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
