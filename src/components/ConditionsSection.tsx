import Reveal from "@/components/Reveal";
import { QUEST } from "@/lib/booking";

const FACTS = [
  { label: "Возраст участников", value: `${QUEST.ageFrom}–${QUEST.ageTo} лет` },
  { label: "Минимум в команде", value: `${QUEST.minParticipants} человек` },
  { label: "Длительность", value: `${QUEST.durationMinutes} час` },
  { label: "Начало сеансов", value: "10:00 · 11:30 · 13:00 · 14:30 · 16:00" },
];

export default function ConditionsSection() {
  return (
    <section id="conditions" className="relative border-t border-gold/12 bg-ink-soft py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-gold/70" />
                <span className="eyebrow">Условия</span>
              </div>
              <h2 className="font-display text-3xl leading-tight text-parchment sm:text-4xl">
                Что важно знать до записи
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-parchment-dim">
              Никаких скрытых доплат: стоимость фиксированная и зависит только от количества детей.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="gold-frame relative overflow-hidden bg-parchment-texture text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
            <div className="pointer-events-none absolute inset-3 border border-ink/10" />

            <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:gap-14 lg:p-12">
              <div className="lg:col-span-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/55">
                  Стоимость участия
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <span className="font-display text-6xl leading-none text-wine sm:text-7xl">
                    {QUEST.pricePerChild.toLocaleString("ru-RU")}
                  </span>
                  <span className="pb-2 font-display text-2xl text-ink/70">₽</span>
                </div>
                <p className="mt-2 text-sm font-medium text-ink/70">за одного ребёнка</p>

                <div className="mt-7 border-t border-ink/15 pt-5">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Итоговая сумма считается в форме автоматически: количество участников ×{" "}
                    {QUEST.pricePerChild.toLocaleString("ru-RU")} ₽. Например, 6 детей —{" "}
                    {(QUEST.pricePerChild * 6).toLocaleString("ru-RU")} ₽, 10 детей —{" "}
                    {(QUEST.pricePerChild * 10).toLocaleString("ru-RU")} ₽.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <dl className="divide-y divide-ink/12 border-y border-ink/12">
                  {FACTS.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                    >
                      <dt className="text-[13px] uppercase tracking-[0.14em] text-ink/55">
                        {fact.label}
                      </dt>
                      <dd className="font-display text-lg text-ink sm:text-xl">{fact.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-6 text-[13px] leading-relaxed text-ink/65">
                  Время начала выбирается из расписания музея. Последний сеанс дня — в 16:00,
                  поэтому квест успевает завершиться до закрытия.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
