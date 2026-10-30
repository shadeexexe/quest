export const QUEST_STATUSES = [
  "Новая",
  "В обработке",
  "Подтверждена",
  "Отменена",
  "Выполнена",
] as const;

export type QuestStatus = (typeof QUEST_STATUSES)[number];

export const AVAILABLE_TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

export type TimeSlot = (typeof AVAILABLE_TIME_SLOTS)[number];

export interface BookingSubmission {
  customerName: string;
  phone: string;
  questDate: string; // YYYY-MM-DD
  questTime: string; // "10:00", etc.
  participantsCount?: number;
  occasion?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  bookingId?: number;
  error?: string;
  errors?: Record<string, string>;
}
