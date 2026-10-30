"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  QUEST,
  QUEST_STATUSES,
  type QuestStatus,
  formatDateTime,
  formatQuestDate,
} from "@/lib/booking";

interface BookingRow {
  id: number;
  createdAt: string;
  surname: string;
  phone: string;
  participantsCount: number;
  questDate: string;
  questTime: string;
  totalPrice: number;
  status: QuestStatus;
  adminComment: string;
  updatedAt: string;
}

const TOKEN_KEY = "hp_quest_admin_token";

function getToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // sessionStorage недоступен — остаётся cookie
  }
}

/** fetch с cookie и токеном администратора в заголовке Authorization. */
function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers, credentials: "include" });
}

const STATUS_STYLES: Record<string, string> = {
  Новая: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  "В обработке": "border-orange-400/40 bg-orange-500/10 text-orange-200",
  Подтверждена: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  Отменена: "border-red-400/40 bg-red-500/10 text-red-200",
  Выполнена: "border-indigo-400/40 bg-indigo-500/10 text-indigo-200",
};

export default function AdminPage() {
  const [authState, setAuthState] = useState<"checking" | "guest" | "admin">("checking");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [rows, setRows] = useState<BookingRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState("received_desc");

  const [commentFor, setCommentFor] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("sort", sort);

      const response = await apiFetch(`/api/admin/bookings?${params.toString()}`, {
        cache: "no-store",
      });

      if (response.status === 401) {
        setAuthState("guest");
        return;
      }

      if (!response.ok) throw new Error("request failed");

      const data = await response.json();
      setRows(data.bookings ?? []);
      setCounts(data.counts ?? {});
    } catch {
      setLoadError("Не удалось загрузить заявки. Проверьте соединение и обновите страницу.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch("/api/admin/check", { cache: "no-store" });
        if (!cancelled) {
          setAuthState(response.ok ? "admin" : "guest");
        }
      } catch {
        if (!cancelled) setAuthState("guest");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authState === "admin") {
      void loadBookings();
    }
  }, [authState, loadBookings]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await apiFetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        if (data.token) setToken(data.token);
        setPassword("");
        setAuthState("admin");
      } else {
        setLoginError(data?.error || "Неверный логин или пароль");
      }
    } catch {
      setLoginError("Нет связи с сервером. Попробуйте ещё раз.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiFetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    setToken(null);
    setAuthState("guest");
    setRows([]);
  };

  const downloadExcel = async () => {
    try {
      const response = await apiFetch("/api/admin/export-excel");
      if (response.status === 401) {
        setAuthState("guest");
        return;
      }
      if (!response.ok) throw new Error("failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GarryPotter_Anapa_bookings_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("Excel-файл скачан");
    } catch {
      notify("Не удалось скачать Excel");
    }
  };

  const updateStatus = async (id: number, status: QuestStatus) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    try {
      const response = await apiFetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("failed");
      notify(`Статус заявки №${id}: ${status}`);
      void loadBookings();
    } catch {
      notify("Не удалось изменить статус. Обновите список.");
      void loadBookings();
    }
  };

  const saveComment = async (id: number) => {
    setSavingId(id);
    try {
      const response = await apiFetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminComment: commentDraft }),
      });
      if (!response.ok) throw new Error("failed");
      setCommentFor(null);
      setCommentDraft("");
      notify(`Комментарий к заявке №${id} сохранён`);
      void loadBookings();
    } catch {
      notify("Не удалось сохранить комментарий");
    } finally {
      setSavingId(null);
    }
  };

  const removeBooking = async (id: number) => {
    if (!window.confirm(`Удалить заявку №${id}? Действие необратимо.`)) return;
    try {
      const response = await apiFetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("failed");
      notify(`Заявка №${id} удалена`);
      void loadBookings();
    } catch {
      notify("Не удалось удалить заявку");
    }
  };

  if (authState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-7 w-7 animate-spin text-gold/70" strokeWidth={1.5} />
      </div>
    );
  }

  if (authState === "guest") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-4 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(92,20,33,0.5),transparent_70%)]" />

        <div className="relative w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-xs text-parchment-dim/70 transition-colors hover:text-gold-soft"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
            На сайт квеста
          </Link>

          <div className="gold-frame bg-ink-card/90 p-6 backdrop-blur-sm sm:p-9">
            <div className="mb-7 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border border-gold/40 bg-wine/30">
                <Lock className="h-4 w-4 text-gold-soft" strokeWidth={1.6} />
              </span>
              <div>
                <p className="font-display text-lg text-parchment">Панель администратора</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-parchment-dim/60">
                  квест «Гарри Поттер» · Анапа
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-user" className="mb-1.5 block text-[13px] text-parchment/90">
                  Логин
                </label>
                <input
                  id="admin-user"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="field-input"
                  placeholder="Логин администратора"
                  required
                />
              </div>

              <div>
                <label htmlFor="admin-pass" className="mb-1.5 block text-[13px] text-parchment/90">
                  Пароль
                </label>
                <input
                  id="admin-pass"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field-input"
                  placeholder="Пароль"
                  required
                />
              </div>

              {loginError && (
                <p role="alert" className="flex items-start gap-2 border border-red-400/40 bg-red-950/40 p-3 text-xs text-red-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="btn-gold w-full px-6 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Проверяем...
                  </>
                ) : (
                  "Войти"
                )}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-parchment-dim/50">
            Доступ только для сотрудников музея. Данные клиентов не публикуются.
          </p>
        </div>
      </div>
    );
  }

  const total = counts.all ?? 0;
  const newCount = counts["Новая"] ?? 0;
  const confirmed = counts["Подтверждена"] ?? 0;
  const revenue = rows
    .filter((row) => row.status === "Подтверждена" || row.status === "Выполнена")
    .reduce((sum, row) => sum + row.totalPrice, 0);

  return (
    <div className="min-h-screen bg-ink pb-16">
      <header className="sticky top-0 z-30 border-b border-gold/15 bg-ink/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-base tracking-[0.12em] text-parchment">ЗАЯВКИ НА КВЕСТ</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-parchment-dim/60">
                «Гарри Поттер» · музей «Экспериментарий»
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 border border-parchment/20 px-3 py-2 text-[11px] text-parchment-dim transition-colors hover:border-gold/50 hover:text-gold-soft lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
              Сайт
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void downloadExcel()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 sm:flex-none"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
              Скачать Excel
            </button>
            <Link
              href="/"
              className="hidden items-center gap-1.5 border border-parchment/20 px-3.5 py-2.5 text-xs text-parchment-dim transition-colors hover:border-gold/50 hover:text-gold-soft lg:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
              На сайт
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 border border-parchment/20 px-3.5 py-2.5 text-xs text-parchment-dim transition-colors hover:border-red-400/50 hover:text-red-200"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.6} />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Всего заявок", value: String(total) },
            { label: "Новые", value: String(newCount) },
            { label: "Подтверждены", value: String(confirmed) },
            { label: "Сумма по выборке", value: `${revenue.toLocaleString("ru-RU")} ₽` },
          ].map((card) => (
            <div key={card.label} className="border border-parchment/12 bg-ink-card/70 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-parchment-dim/60">{card.label}</p>
              <p className="mt-1.5 font-display text-xl text-parchment sm:text-2xl">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border border-parchment/12 bg-ink-card/60 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment-dim/50" strokeWidth={1.6} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по фамилии или телефону"
              className="field-input py-2.5 pl-9 text-sm"
              aria-label="Поиск заявок"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="field-input flex-1 py-2.5 text-xs sm:w-auto"
              aria-label="Сортировка"
            >
              <option value="received_desc">Сначала новые</option>
              <option value="received_asc">Сначала старые</option>
              <option value="quest_date_asc">Дата квеста: раньше</option>
              <option value="quest_date_desc">Дата квеста: позже</option>
            </select>

            <button
              type="button"
              onClick={() => void loadBookings()}
              disabled={loading}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center border border-parchment/20 text-parchment-dim transition-colors hover:border-gold/50 hover:text-gold-soft disabled:opacity-50"
              aria-label="Обновить список"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div className="thin-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
          {["all", ...QUEST_STATUSES].map((status) => {
            const active = statusFilter === status;
            const label = status === "all" ? "Все" : status;
            const count = status === "all" ? total : counts[status] ?? 0;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`flex-shrink-0 border px-3 py-2 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-gold/60 bg-gold/15 text-gold-soft"
                    : "border-parchment/15 text-parchment-dim hover:border-parchment/35"
                }`}
              >
                {label} · {count}
              </button>
            );
          })}
        </div>

        {loadError && (
          <p role="alert" className="mt-4 flex items-start gap-2 border border-red-400/40 bg-red-950/40 p-3 text-xs text-red-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
            {loadError}
          </p>
        )}

        <div className="mt-5 space-y-3">
          {loading && rows.length === 0 && (
            <div className="flex items-center justify-center gap-2 border border-parchment/12 bg-ink-card/60 py-12 text-xs text-parchment-dim">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
              Загружаем заявки...
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="border border-parchment/12 bg-ink-card/60 px-5 py-14 text-center">
              <p className="font-display text-lg text-parchment">Заявок пока нет</p>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-parchment-dim/70">
                Как только родитель отправит форму на сайте, заявка появится здесь автоматически.
              </p>
            </div>
          )}

          {rows.map((row) => (
            <article key={row.id} className="border border-parchment/12 bg-ink-card/70 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg text-parchment">№{row.id}</span>
                    <span
                      className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        STATUS_STYLES[row.status] ?? "border-parchment/20 text-parchment-dim"
                      }`}
                    >
                      {row.status}
                    </span>
                    {row.status === "Новая" && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-amber-300/90">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                        ждёт звонка
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-display text-xl text-parchment">{row.surname}</p>
                  <a
                    href={`tel:${row.phone.replace(/\D/g, "")}`}
                    className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm text-gold-soft/90 hover:text-gold-soft"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.6} />
                    {row.phone}
                  </a>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-parchment-dim/60">Получена</p>
                  <p className="text-xs text-parchment/85">{formatDateTime(row.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-parchment/10 pt-4 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-parchment-dim/60">День квеста</p>
                  <p className="mt-0.5 text-sm text-parchment">{formatQuestDate(row.questDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-parchment-dim/60">Время</p>
                  <p className="mt-0.5 text-sm text-parchment">{row.questTime}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-parchment-dim/60">Участники</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-parchment">
                    <Users className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.6} />
                    {row.participantsCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-parchment-dim/60">Сумма</p>
                  <p className="mt-0.5 text-sm font-semibold text-gold-soft">
                    {row.totalPrice.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
              </div>

              {row.adminComment && commentFor !== row.id && (
                <div className="mt-4 flex items-start gap-2 border-l border-gold/40 bg-ink/50 p-3 text-xs leading-relaxed text-parchment/80">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold/70" strokeWidth={1.6} />
                  <span>{row.adminComment}</span>
                </div>
              )}

              {commentFor === row.id && (
                <div className="mt-4 border border-gold/25 bg-ink/60 p-3">
                  <label htmlFor={`comment-${row.id}`} className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-parchment-dim/70">
                    Комментарий администратора
                  </label>
                  <textarea
                    id={`comment-${row.id}`}
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Например: перезвонили, подтвердили 8 детей, день рождения в субботу"
                    className="field-input resize-y text-sm"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCommentFor(null);
                        setCommentDraft("");
                      }}
                      className="inline-flex items-center gap-1.5 border border-parchment/20 px-3 py-2 text-xs text-parchment-dim transition-colors hover:border-parchment/40"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.6} />
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveComment(row.id)}
                      disabled={savingId === row.id}
                      className="btn-gold px-4 py-2 text-xs disabled:opacity-70"
                    >
                      {savingId === row.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                      ) : (
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      )}
                      Сохранить
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-parchment/10 pt-3">
                <label htmlFor={`status-${row.id}`} className="text-[10px] uppercase tracking-[0.14em] text-parchment-dim/60">
                  Статус
                </label>
                <select
                  id={`status-${row.id}`}
                  value={row.status}
                  onChange={(event) => void updateStatus(row.id, event.target.value as QuestStatus)}
                  className="field-input w-auto py-1.5 text-xs"
                >
                  {QUEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setCommentFor(row.id);
                    setCommentDraft(row.adminComment ?? "");
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 border border-parchment/20 px-3 py-2 text-xs text-parchment-dim transition-colors hover:border-gold/50 hover:text-gold-soft"
                >
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.6} />
                  {row.adminComment ? "Изменить заметку" : "Добавить заметку"}
                </button>

                <button
                  type="button"
                  onClick={() => void removeBooking(row.id)}
                  className="inline-flex items-center gap-1.5 border border-parchment/20 px-3 py-2 text-xs text-parchment-dim transition-colors hover:border-red-400/50 hover:text-red-200"
                  aria-label={`Удалить заявку №${row.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-parchment-dim/50">
          Телефон музея: {QUEST.phone} · данные хранятся в PostgreSQL и не теряются при перезагрузке
        </p>
      </main>

      {toast && (
        <div className="animate-fade-up fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 border border-gold/40 bg-ink-card px-4 py-3 text-center text-xs text-parchment shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
