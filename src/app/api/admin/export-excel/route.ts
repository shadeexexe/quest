import { asc } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateBookingsExcel } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  try {
    const rows = await db.select().from(bookings).orderBy(asc(bookings.id));
    const buffer = await generateBookingsExcel(rows);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="GarryPotter_Anapa_bookings_${date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Ошибка выгрузки Excel:", error);
    return Response.json({ error: "Не удалось сформировать Excel-файл" }, { status: 500 });
  }
}
