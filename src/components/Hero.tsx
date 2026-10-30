import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";

const EMBERS = [
  { left: "12%", bottom: "18%", delay: "0s", duration: "9s" },
  { left: "28%", bottom: "8%", delay: "2.4s", duration: "11s" },
  { left: "46%", bottom: "22%", delay: "1.2s", duration: "10s" },
  { left: "63%", bottom: "12%", delay: "3.6s", duration: "12s" },
  { left: "78%", bottom: "26%", delay: "0.8s", duration: "9.5s" },
  { left: "88%", bottom: "10%", delay: "4.4s", duration: "13s" },
];

export default function Hero() {
  return (
    <section id="top" className="relative isolate min-h-[94svh] flex flex-col justify-end overflow-hidden">
      {/* Фотография музея — реальный снимок с официального сайта */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/museum/museum-1.jpg"
          alt="Интерьер музея «Экспериментарий» в Анапе"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/70 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/55 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,transparent_20%,rgba(10,6,5,0.85)_100%)]" />
      </div>

      {/* Магические искры */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {EMBERS.map((ember, index) => (
          <span
            key={index}
            className="ember"
            style={{
              left: ember.left,
              bottom: ember.bottom,
              animationDelay: ember.delay,
              animationDuration: ember.duration,
            }}
          />
        ))}
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-32 pb-14 sm:pb-20">
        <div className="max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-gold/70" />
            <span className="eyebrow">Музей «Экспериментарий» · Анапа</span>
          </div>

          <h1 className="font-display text-[2.6rem] leading-[1.03] tracking-tight text-parchment sm:text-6xl lg:text-[4.6rem]">
            Квест
            <br />
            <span className="text-gold-soft">«Гарри Поттер»</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-parchment/85 sm:text-lg">
            Экспонаты музея превращаются в магические артефакты, а ребёнок проходит испытания
            вместе с друзьями. Без лекций и экскурсий — только задания, которые нужно решить.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#booking"
              className="btn-gold group px-7 py-4 text-[15px] sm:text-base"
            >
              Записаться на квест
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
            </a>
            <a href="#about" className="btn-ghost px-6 py-4 text-sm">
              Что будет на квесте
            </a>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-parchment-dim/80">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold/80" strokeWidth={1.6} />
              Анапа
            </span>
            <span className="hidden h-3 w-px bg-parchment/20 sm:block" />
            <span>Организатор — музей «Экспериментарий»</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />
    </section>
  );
}
