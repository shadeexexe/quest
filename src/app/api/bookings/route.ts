import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { validateBookingPayload } from "@/lib/booking";

export const dynamic = "force-dynamic";

/**
 * Простое ограничение частоты запросов в памяти процесса:
 * не более 5 заявок с одного IP за 10 минут.
 */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateBuckets.set(ip, hits);

  if (rateBuckets.size > 500) {
    for (const [key, times] of rateBuckets) {
      if (times.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) {
        rateBuckets.delete(key);
      }
    }
  }

  return hits.length > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Слишком много заявок с этого устройства. Подождите несколько минут или позвоните в музей.",
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Не удалось прочитать данные формы. Попробуйте ещё раз." },
      { status: 400 }
    );
  }

  const validation = validateBookingPayload(body);
  if (!validation.ok || !validation.data) {
    return NextResponse.json(
      {
        success: false,
        error: "Проверьте заполнение формы",
        errors: validation.errors,
      },
      { status: 422 }
    );
  }

  const data = validation.data;

  try {
    // Защита от случайной повторной отправки: та же фамилия, телефон, дата и время
    // в течение последних 3 минут считаются одной заявкой.
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const existing = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.phone, data.phone),
          eq(bookings.questDate, data.questDate),
          eq(bookings.questTime, data.questTime),
          gte(bookings.createdAt, threeMinutesAgo)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        bookingId: existing[0].id,
        message: "Заявка уже принята. Мы свяжемся с вами для подтверждения.",
      });
    }

    const [created] = await db
      .insert(bookings)
      .values({
        surname: data.surname,
        phone: data.phone,
        participantsCount: data.participantsCount,
        questDate: data.questDate,
        questTime: data.questTime,
        totalPrice: data.totalPrice,
        status: "Новая",
        adminComment: "",
      })
      .returning({ id: bookings.id });

    return NextResponse.json(
      {
        success: true,
        bookingId: created.id,
        message: "Заявка сохранена. Администратор свяжется с вами для подтверждения.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка сохранения заявки:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Не удалось сохранить заявку. Попробуйте отправить её ещё раз через минуту или позвоните в музей.",
      },
      { status: 500 }
    );
  }
}
