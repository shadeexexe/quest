import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Заявки на квест «Гарри Поттер» в музее «Экспериментарий» (Анапа).
 * Данные хранятся в PostgreSQL и не теряются при перезапуске приложения.
 */
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  surname: text("surname").notNull(),
  phone: text("phone").notNull(),
  participantsCount: integer("participants_count").notNull(),
  questDate: text("quest_date").notNull(),
  questTime: text("quest_time").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: text("status").default("Новая").notNull(),
  adminComment: text("admin_comment").default("").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
