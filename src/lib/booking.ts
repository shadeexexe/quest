export const QUEST = {
  title: "Гарри Поттер",
  museum: "Экспериментарий",
  city: "Анапа",
  address: "Анапа, ул. Рождественская, 55 корпус 2",
  phone: "+7 988 330-88-80",
  phoneHref: "tel:+79883308880",
  site: "https://www.experimentariy.ru/",
  ageFrom: 8,
  ageTo: 10,
  minParticipants: 6,
  maxParticipants: 20,
  durationMinutes: 60,
  pricePerChild: 1000,
} as const;

export const QUEST_STATUSES = ["Новая", "В обработке", "Подтверждена", "Отменена", "Выполнена"] as const;
export type QuestStatus = (typeof QUEST_STATUSES)[number];

/** Время начала квеста: с 10:00 до 16:00, интервал 1,5 часа (расписание музея). */
export const TIME_SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export function isTimeSlot(value: string): value is TimeSlot {
  return (TIME_SLOTS as readonly string[]).includes(value);
}

export function calculateTotal(participants: number): number {
  return Math.max(0, Math.round(participants)) * QUEST.pricePerChild;
}

/** Сегодняшняя дата в формате YYYY-MM-DD по местному времени сервера. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Дата не может быть в прошлом. */
export function isNotPastDate(value: string): boolean {
  if (!isValidISODate(value)) return false;
  return value >= todayISO();
}

/**
 * Приводит номер телефона к виду +7 (XXX) XXX-XX-XX.
 * Возвращает null, если номер не похож на российский.
 */
export function normalizePhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;

  let national = digits;
  if (national.length === 11 && (national.startsWith("7") || national.startsWith("8"))) {
    national = national.slice(1);
  }
  if (national.length !== 10) return null;
  if (!/^[39]\d{9}$/.test(national)) return null;

  return `+7 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6, 8)}-${national.slice(8, 10)}`;
}

/** Маска для ввода в форме. */
export function maskPhoneInput(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";

  let national = digits;
  if (national.startsWith("7") || national.startsWith("8")) {
    national = national.slice(1);
  }
  national = national.slice(0, 10);

  let out = "+7";
  if (national.length > 0) out += ` (${national.slice(0, 3)}`;
  if (national.length >= 3) out += `) ${national.slice(3, 6)}`;
  if (national.length >= 6) out += `-${national.slice(6, 8)}`;
  if (national.length >= 8) out += `-${national.slice(8, 10)}`;
  return out;
}

export function formatQuestDate(value: string): string {
  if (!isValidISODate(value)) return value;
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function pluralChildren(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "ребёнок";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "ребёнка";
  return "детей";
}

export interface BookingPayload {
  surname: string;
  phone: string;
  participantsCount: number;
  questDate: string;
  questTime: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  data?: {
    surname: string;
    phone: string;
    participantsCount: number;
    questDate: string;
    questTime: TimeSlot;
    totalPrice: number;
  };
}

/** Единая серверная валидация заявки. */
export function validateBookingPayload(input: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  const body = (input ?? {}) as Record<string, unknown>;

  const surname = typeof body.surname === "string" ? body.surname.trim().replace(/\s+/g, " ") : "";
  if (!surname) {
    errors.surname = "Укажите фамилию заказчика";
  } else if (surname.length < 2) {
    errors.surname = "Фамилия должна содержать минимум 2 символа";
  } else if (surname.length > 60) {
    errors.surname = "Слишком длинная фамилия (до 60 символов)";
  }

  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phone = normalizePhone(rawPhone);
  if (!rawPhone) {
    errors.phone = "Укажите номер телефона";
  } else if (!phone) {
    errors.phone = "Проверьте номер: нужен российский номер из 10 цифр";
  }

  const participantsRaw = Number(body.participantsCount);
  const participantsCount = Number.isFinite(participantsRaw) ? Math.round(participantsRaw) : 0;
  if (!participantsCount) {
    errors.participantsCount = "Укажите количество участников";
  } else if (participantsCount < QUEST.minParticipants) {
    errors.participantsCount = `Минимум ${QUEST.minParticipants} участников`;
  } else if (participantsCount > QUEST.maxParticipants) {
    errors.participantsCount = `Максимум ${QUEST.maxParticipants} участников — позвоните нам для большой компании`;
  }

  const questDate = typeof body.questDate === "string" ? body.questDate.trim() : "";
  if (!questDate) {
    errors.questDate = "Выберите день проведения";
  } else if (!isValidISODate(questDate)) {
    errors.questDate = "Некорректная дата";
  } else if (!isNotPastDate(questDate)) {
    errors.questDate = "Нельзя выбрать прошедший день";
  }

  const questTime = typeof body.questTime === "string" ? body.questTime.trim() : "";
  if (!questTime) {
    errors.questTime = "Выберите время начала";
  } else if (!isTimeSlot(questTime)) {
    errors.questTime = `Доступное время: ${TIME_SLOTS.join(", ")}`;
  }

  if (Object.keys(errors).length > 0 || !phone) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    data: {
      surname,
      phone,
      participantsCount,
      questDate,
      questTime: questTime as TimeSlot,
      totalPrice: calculateTotal(participantsCount),
    },
  };
}
