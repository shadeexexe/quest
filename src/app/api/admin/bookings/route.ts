import { NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { QUEST_STATUSES, calculateTotal, validateBookingPayload } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "all").trim();
    const sort = (searchParams.get("sort") || "received_desc").trim();

    const filters = [];
    if (status !== "all" && (QUEST_STATUSES as readonly string[]).includes(status)) {
      filters.push(eq(bookings.status, status));
    }
    if (search) {
      const digits = search.replace(/\D/g, "");
      const conditions = [
        ilike(bookings.surname, `%${search}%`),
        ilike(bookings.adminComment, `%${search}%`),
      ];

      // Поиск по телефону без учёта форматирования: сравниваем только цифры.
      if (digits.length >= 3) {
        conditions.push(
          sql`regexp_replace(${bookings.phone}, '[^0-9]', '', 'g') LIKE ${`%${digits}%`}`
        );
      } else {
        conditions.push(ilike(bookings.phone, `%${search}%`));
      }

      filters.push(or(...conditions));
    }

    const orderBy =
      sort === "received_asc"
        ? asc(bookings.createdAt)
        : sort === "quest_date_asc"
          ? asc(bookings.questDate)
          : sort === "quest_date_desc"
            ? desc(bookings.questDate)
            : desc(bookings.createdAt);

    const rows = await db
      .select()
      .from(bookings)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(orderBy);

    const statusRows = await db
      .select({ status: bookings.status, count: sql<number>`count(*)::int` })
      .from(bookings)
      .groupBy(bookings.status);

    const counts: Record<string, number> = { all: 0 };
    QUEST_STATUSES.forEach((s) => {
      counts[s] = 0;
    });
    statusRows.forEach((row) => {
      counts[row.status] = row.count;
      counts.all += row.count;
    });

    return NextResponse.json({ success: true, bookings: rows, counts });
  } catch (error) {
    console.error("Ошибка загрузки заявок:", error);
    return NextResponse.json({ error: "Не удалось загрузить заявки" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const validation = validateBookingPayload(body);
  if (!validation.ok || !validation.data) {
    return NextResponse.json(
      { error: "Проверьте поля заявки", errors: validation.errors },
      { status: 422 }
    );
  }

  const data = validation.data;
  const rawStatus = (body as Record<string, unknown>).status;
  const status =
    typeof rawStatus === "string" && (QUEST_STATUSES as readonly string[]).includes(rawStatus)
      ? rawStatus
      : "Новая";

  try {
    const [created] = await db
      .insert(bookings)
      .values({
        surname: data.surname,
        phone: data.phone,
        participantsCount: data.participantsCount,
        questDate: data.questDate,
        questTime: data.questTime,
        totalPrice: calculateTotal(data.participantsCount),
        status,
        adminComment: "",
      })
      .returning();

    return NextResponse.json({ success: true, booking: created }, { status: 201 });
  } catch (error) {
    console.error("Ошибка добавления заявки администратором:", error);
    return NextResponse.json({ error: "Не удалось сохранить заявку" }, { status: 500 });
  }
}
