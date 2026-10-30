import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { QUEST_STATUSES, calculateTotal } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) {
    return NextResponse.json({ error: "Некорректный номер заявки" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const update: Partial<typeof bookings.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.status === "string") {
    if (!(QUEST_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
    }
    update.status = body.status;
  }

  if (typeof body.adminComment === "string") {
    update.adminComment = body.adminComment.slice(0, 2000);
  }

  if (typeof body.participantsCount === "number" && Number.isFinite(body.participantsCount)) {
    const count = Math.round(body.participantsCount);
    if (count < 1 || count > 50) {
      return NextResponse.json({ error: "Некорректное количество участников" }, { status: 400 });
    }
    update.participantsCount = count;
    update.totalPrice = calculateTotal(count);
  }

  try {
    const [updated] = await db
      .update(bookings)
      .set(update)
      .where(eq(bookings.id, bookingId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Ошибка обновления заявки:", error);
    return NextResponse.json({ error: "Не удалось обновить заявку" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) {
    return NextResponse.json({ error: "Некорректный номер заявки" }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(bookings)
      .where(eq(bookings.id, bookingId))
      .returning({ id: bookings.id });

    if (!deleted) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления заявки:", error);
    return NextResponse.json({ error: "Не удалось удалить заявку" }, { status: 500 });
  }
}
