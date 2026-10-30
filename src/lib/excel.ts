import ExcelJS from "exceljs";
import type { Booking } from "@/db/schema";
import { formatDateTime, formatQuestDate } from "@/lib/booking";

export async function generateBookingsExcel(rows: Booking[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Музей «Экспериментарий» — квест «Гарри Поттер»";
  workbook.lastModifiedBy = "Администратор";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet("Заявки на квест", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 22 },
  });

  sheet.columns = [
    { header: "№ заявки", key: "id", width: 12 },
    { header: "Дата и время получения", key: "createdAt", width: 24 },
    { header: "Фамилия заказчика", key: "surname", width: 26 },
    { header: "Номер телефона", key: "phone", width: 22 },
    { header: "Количество участников", key: "participantsCount", width: 20 },
    { header: "Желаемый день квеста", key: "questDate", width: 20 },
    { header: "Желаемое время", key: "questTime", width: 16 },
    { header: "Итоговая стоимость, ₽", key: "totalPrice", width: 20 },
    { header: "Статус заявки", key: "status", width: 18 },
    { header: "Комментарий администратора", key: "adminComment", width: 40 },
  ];

  sheet.autoFilter = { from: "A1", to: "J1" };

  const header = sheet.getRow(1);
  header.height = 34;
  header.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFF3E3C3" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2A0A10" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.border = {
    bottom: { style: "medium", color: { argb: "FFC9A227" } },
  };

  const border: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFE7DCC8" } },
    left: { style: "thin", color: { argb: "FFE7DCC8" } },
    bottom: { style: "thin", color: { argb: "FFE7DCC8" } },
    right: { style: "thin", color: { argb: "FFE7DCC8" } },
  };

  const statusStyles: Record<string, { fg: string; bg: string }> = {
    Новая: { fg: "FF8A5A00", bg: "FFFDF1D6" },
    "В обработке": { fg: "FF8A5A00", bg: "FFFCEBC7" },
    Подтверждена: { fg: "FF1E5B3A", bg: "FFDCF3E4" },
    Отменена: { fg: "FF8C1D18", bg: "FFFBE0DE" },
    Выполнена: { fg: "FF3B3A6B", bg: "FFE6E4F5" },
  };

  rows.forEach((row, index) => {
    const added = sheet.addRow({
      id: row.id,
      createdAt: formatDateTime(row.createdAt),
      surname: row.surname,
      phone: String(row.phone),
      participantsCount: row.participantsCount,
      questDate: formatQuestDate(row.questDate),
      questTime: row.questTime,
      totalPrice: row.totalPrice,
      status: row.status,
      adminComment: row.adminComment || "",
    });

    added.height = 24;
    const bg = index % 2 === 0 ? "FFFFFFFF" : "FFFAF6EF";

    added.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 10 };
      cell.border = border;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.alignment = {
        vertical: "middle",
        horizontal: [1, 5, 6, 7, 8, 9].includes(colNumber) ? "center" : "left",
        wrapText: colNumber === 10,
      };

      // Телефон хранится как текст, чтобы не потерять символы и нули.
      if (colNumber === 4) {
        cell.numFmt = "@";
      }
      if (colNumber === 8) {
        cell.numFmt = "#,##0 ₽";
      }

      if (colNumber === 9) {
        const style = statusStyles[row.status] ?? { fg: "FF3F3F46", bg: "FFF4F4F5" };
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: style.fg } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.bg } };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
