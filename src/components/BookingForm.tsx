"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import {
  QUEST,
  TIME_SLOTS,
  calculateTotal,
  isValidISODate,
  maskPhoneInput,
  normalizePhone,
  pluralChildren,
  todayISO,
} from "@/lib/booking";

type Errors = Record<string, string>;

const STEPS = [
  "Оставляете заявку на сайте",
  "Администратор звонит и подтверждает время",
  "Приходите в музей в выбранный день",
];

function tomorrowISO(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function BookingForm() {
  const today = useMemo(() => todayISO(), []);
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [participants, setParticipants] = useState<number>(QUEST.minParticipants);
  const [questDate, setQuestDate] = useState(() => tomorrowISO());
  const [questTime, setQuestTime] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ bookingId?: number } | null>(null);

  const total = calculateTotal(participants);

  const validate = (): boolean => {
    const next: Errors = {};

    if (!surname.trim()) {
      next.surname = "Укажите фамилию заказчика";
    } else if (surname.trim().length < 2) {
      next.surname = "Фамилия должна содержать минимум 2 символа";
    }

    if (!phone.trim()) {
      next.phone = "Укажите номер телефона";
    } else if (!normalizePhone(phone)) {
      next.phone = "Проверьте номер: нужен российский номер из 10 цифр";
    }

    if (!participants || participants < QUEST.minParticipants) {
      next.participants = `Минимум ${QUEST.minParticipants} участников`;
    }

    if (!questDate) {
      next.questDate = "Выберите день проведения";
    } else if (!isValidISODate(questDate)) {
      next.questDate = "Некорректная дата";
    } else if (questDate < today) {
      next.questDate = "Нельзя выбрать прошедший день";
    }

    if (!questTime) {
      next.questTime = "Выберите время начала";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setNetworkWarning(null);

    // Скрытое поле-ловушка для спам-ботов: запрос не отправляется.
    if (honeypot) return;

    if (!validate()) return;

    setSubmitting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surname: surname.trim(),
          phone: phone.trim(),
          participantsCount: participants,
          questDate,
          questTime,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let data: {
        success?: boolean;
        bookingId?: number;
        error?: string;
        errors?: Errors;
        message?: string;
      } | null = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        if (data?.errors) setErrors(data.errors);
        setFormError(
          data?.error ||
            "Не удалось отправить заявку. Попробуйте ещё раз через минуту или позвоните в музей."
        );
        setSubmitting(false);
        return;
      }

      setSuccess({ bookingId: data.bookingId });
      setSubmitting(false);
    } catch (error) {
      clearTimeout(timeout);
      setSubmitting(false);

      const aborted = error instanceof Error && error.name === "AbortError";
      if (aborted) {
        setNetworkWarning(
          "Сервер не ответил вовремя. Статус заявки неизвестен — позвоните в музей, чтобы проверить, не создалась ли она, и не отправляйте форму повторно."
        );
      } else {
        setFormError(
          "Нет связи с сервером. Проверьте подключение к интернету и попробуйте ещё раз."
        );
      }
    }
  };

  const resetForm = () => {
    setSuccess(null);
    setSurname("");
    setPhone("");
    setParticipants(QUEST.minParticipants);
    setQuestDate(tomorrowISO());
    setQuestTime("");
    setErrors({});
    setFormError(null);
    setNetworkWarning(null);
  };

  return (
    <section id="booking" className="relative border-t border-gold/12 bg-wine/12 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(92,20,33,0.35),transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-gold/70" />
                <span className="eyebrow">Запись</span>
              </div>
              <h2 className="font-display text-3xl leading-[1.12] text-parchment sm:text-4xl">
                Оставьте заявку —
                <br />
                <span className="text-gold-soft">администратор перезвонит</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-parchment-dim sm:text-[15px]">
                Заполните форму: мы свяжемся с вами, подтвердим дату и время, ответим на вопросы
                по организации квеста.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <ol className="mt-8 space-y-4 border-l border-gold/25 pl-5">
                {STEPS.map((step, index) => (
                  <li key={step} className="relative text-sm text-parchment/85">
                    <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-gold/60 bg-ink text-[9px] font-bold text-gold-soft">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={160}>
              <a
                href={QUEST.phoneHref}
                className="mt-8 inline-flex items-center gap-2 border border-parchment/20 px-4 py-3 text-sm text-parchment transition-colors hover:border-gold/60 hover:text-gold-soft"
              >
                <Phone className="h-4 w-4 text-gold/80" strokeWidth={1.6} />
                {QUEST.phone}
              </a>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={60}>
              <div className="gold-frame relative bg-ink-card/85 p-5 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.95)] backdrop-blur-sm sm:p-8">
                {success ? (
                  <div className="animate-fade-up py-6 text-center sm:py-10">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-gold/10">
                      <Check className="h-7 w-7 text-gold-soft" strokeWidth={1.8} />
                    </div>
                    <h3 className="mt-6 font-display text-2xl text-parchment sm:text-3xl">
                      Заявка принята
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-parchment-dim">
                      Администратор музея свяжется с вами по указанному телефону, чтобы подтвердить
                      дату и время квеста.
                    </p>
                    {success.bookingId && (
                      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-parchment-dim/70">
                        Номер заявки: <span className="text-gold-soft">№{success.bookingId}</span>
                      </p>
                    )}
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                      <button type="button" onClick={resetForm} className="btn-gold px-6 py-3.5 text-sm">
                        Отправить ещё одну заявку
                      </button>
                      <a href={QUEST.phoneHref} className="btn-ghost px-6 py-3.5 text-sm">
                        <Phone className="h-4 w-4" strokeWidth={1.6} />
                        Позвонить в музей
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="surname" className="mb-1.5 block text-[13px] font-medium text-parchment/90">
                          Фамилия заказчика <span className="text-gold-soft">*</span>
                        </label>
                        <input
                          id="surname"
                          name="surname"
                          type="text"
                          autoComplete="family-name"
                          value={surname}
                          onChange={(event) => {
                            setSurname(event.target.value);
                            if (errors.surname) setErrors((prev) => ({ ...prev, surname: "" }));
                          }}
                          aria-invalid={Boolean(errors.surname)}
                          aria-describedby={errors.surname ? "surname-error" : undefined}
                          className="field-input"
                          placeholder="Например, Смирнова"
                          disabled={submitting}
                        />
                        {errors.surname && (
                          <p id="surname-error" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-300">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
                            {errors.surname}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="phone" className="mb-1.5 block text-[13px] font-medium text-parchment/90">
                          Номер телефона <span className="text-gold-soft">*</span>
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(event) => {
                            setPhone(maskPhoneInput(event.target.value));
                            if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                          }}
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={errors.phone ? "phone-error" : undefined}
                          className="field-input font-mono tracking-wide"
                          placeholder="+7 (___) ___-__-__"
                          disabled={submitting}
                        />
                        {errors.phone && (
                          <p id="phone-error" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-300">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="mb-1.5 block text-[13px] font-medium text-parchment/90">
                        Количество участников <span className="text-gold-soft">*</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setParticipants((value) => Math.max(QUEST.minParticipants, value - 1))}
                          disabled={submitting || participants <= QUEST.minParticipants}
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-parchment/20 text-parchment transition-colors hover:border-gold/60 hover:text-gold-soft disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label="Уменьшить количество участников"
                        >
                          <Minus className="h-4 w-4" strokeWidth={1.8} />
                        </button>

                        <div className="flex h-12 flex-1 items-center justify-center border border-parchment/15 bg-ink/60 px-3">
                          <span className="font-display text-xl text-parchment">{participants}</span>
                          <span className="ml-2 text-xs text-parchment-dim">
                            {pluralChildren(participants)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setParticipants((value) => Math.min(QUEST.maxParticipants, value + 1))}
                          disabled={submitting || participants >= QUEST.maxParticipants}
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-parchment/20 text-parchment transition-colors hover:border-gold/60 hover:text-gold-soft disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label="Увеличить количество участников"
                        >
                          <Plus className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-parchment-dim/80">
                        Минимум {QUEST.minParticipants} человек. Для большей компании позвоните в музей.
                      </p>
                      {errors.participants && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-300">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
                          {errors.participants}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="questDate" className="mb-1.5 block text-[13px] font-medium text-parchment/90">
                          Желаемый день <span className="text-gold-soft">*</span>
                        </label>
                        <input
                          id="questDate"
                          name="questDate"
                          type="date"
                          min={today}
                          value={questDate}
                          onChange={(event) => {
                            setQuestDate(event.target.value);
                            if (errors.questDate) setErrors((prev) => ({ ...prev, questDate: "" }));
                          }}
                          aria-invalid={Boolean(errors.questDate)}
                          aria-describedby={errors.questDate ? "questDate-error" : undefined}
                          className="field-input"
                          disabled={submitting}
                        />
                        {errors.questDate && (
                          <p id="questDate-error" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-300">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
                            {errors.questDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="questTime" className="mb-1.5 block text-[13px] font-medium text-parchment/90">
                          Желаемое время <span className="text-gold-soft">*</span>
                        </label>
                        <select
                          id="questTime"
                          name="questTime"
                          value={questTime}
                          onChange={(event) => {
                            setQuestTime(event.target.value);
                            if (errors.questTime) setErrors((prev) => ({ ...prev, questTime: "" }));
                          }}
                          aria-invalid={Boolean(errors.questTime)}
                          aria-describedby={errors.questTime ? "questTime-error" : undefined}
                          className="field-input"
                          disabled={submitting}
                        >
                          <option value="">Выберите время</option>
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                        {errors.questTime && (
                          <p id="questTime-error" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-300">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
                            {errors.questTime}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Скрытая ловушка для спам-ботов */}
                    <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                      <label htmlFor="company">Компания</label>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(event) => setHoneypot(event.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-3 border-t border-parchment/12 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-parchment-dim/70">
                          Итого к оплате
                        </p>
                        <p className="font-display text-3xl text-gold-soft">
                          {total.toLocaleString("ru-RU")} ₽
                        </p>
                        <p className="text-[11px] text-parchment-dim/70">
                          {participants} × {QUEST.pricePerChild.toLocaleString("ru-RU")} ₽
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-gold w-full px-7 py-4 text-[15px] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                            Отправляем...
                          </>
                        ) : (
                          <>
                            Отправить заявку
                            <ArrowRight className="h-4 w-4" strokeWidth={2} />
                          </>
                        )}
                      </button>
                    </div>

                    {formError && (
                      <div
                        role="alert"
                        className="animate-shake flex items-start gap-2.5 border border-red-400/40 bg-red-950/40 p-3.5 text-xs leading-relaxed text-red-200"
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.8} />
                        <span>{formError}</span>
                      </div>
                    )}

                    {networkWarning && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 border border-amber-400/40 bg-amber-950/40 p-3.5 text-xs leading-relaxed text-amber-100"
                      >
                        <Phone className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.8} />
                        <span>
                          {networkWarning}{" "}
                          <a href={QUEST.phoneHref} className="font-semibold underline">
                            {QUEST.phone}
                          </a>
                        </span>
                      </div>
                    )}

                    <p className="flex items-start gap-2 text-[11px] leading-relaxed text-parchment-dim/70">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold/70" strokeWidth={1.6} />
                      Данные нужны только для подтверждения бронирования. Нажимая кнопку, вы
                      соглашаетесь на их обработку.
                    </p>
                  </form>
                )}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-parchment-dim/60">
                <Sparkles className="h-3.5 w-3.5 text-gold/60" strokeWidth={1.6} />
                Квест проводит музей «Экспериментарий» в Анапе
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
