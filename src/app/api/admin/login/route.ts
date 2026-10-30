import { NextResponse } from "next/server";
import { verifyAdminCredentials, setAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "Введите логин и пароль" },
      { status: 400 }
    );
  }

  try {
    const valid = await verifyAdminCredentials(username, password);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    const token = await setAdminSession();
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Ошибка входа администратора:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка сервера при входе" },
      { status: 500 }
    );
  }
}
