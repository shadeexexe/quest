-- Таблица заявок на квест «Гарри Поттер»
-- Выполните этот SQL один раз в Neon → SQL Editor → Run

CREATE TABLE IF NOT EXISTS bookings (
  id serial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  surname text NOT NULL,
  phone text NOT NULL,
  participants_count integer NOT NULL,
  quest_date text NOT NULL,
  quest_time text NOT NULL,
  total_price integer NOT NULL,
  status text NOT NULL DEFAULT 'Новая',
  admin_comment text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
