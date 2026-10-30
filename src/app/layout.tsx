import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Квест «Гарри Поттер» в Анапе — запись на детский квест (8–10 лет)",
  description:
    "Детский квест «Гарри Поттер» в музее «Экспериментарий» в Анапе. Возраст 8–10 лет, от 6 участников, 1 час, 1000 ₽ за ребёнка. Онлайн-запись с подтверждением по телефону.",
  keywords: [
    "квест Гарри Поттер Анапа",
    "детский квест Анапа",
    "музей Экспериментарий Анапа",
    "квест на день рождения Анапа",
    "квест для детей 8-10 лет",
  ],
  openGraph: {
    title: "Квест «Гарри Поттер» в Анапе",
    description:
      "Час приключений в музее «Экспериментарий»: задания, экспонаты и командная игра для детей 8–10 лет.",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0605",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-ink text-parchment antialiased">{children}</body>
    </html>
  );
}
