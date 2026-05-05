-- Neon = PostgreSQL. Выполните в SQL Editor в консоли Neon или через psql.
-- Оба поля с формы — части логина (второе поле не «пароль»).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Первое поле: телефон, электронная почта или СНИЛС
    login_part_1 TEXT NOT NULL,

    -- Второе поле: продолжение / вторая часть логина (не пароль)
    login_part_2 TEXT NOT NULL,

    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT users_login_part_1_nonempty
        CHECK (length(trim(login_part_1)) > 0),
    CONSTRAINT users_login_part_2_nonempty
        CHECK (length(trim(login_part_2)) > 0)
);

-- Уникальность пары частей логина (если одна и та же пара не должна повторяться — оставьте;
-- если записи могут дублироваться — удалите этот индекс)
CREATE UNIQUE INDEX IF NOT EXISTS users_login_pair_unique
    ON public.users (
        lower(trim(login_part_1)),
        lower(trim(login_part_2))
    );

CREATE INDEX IF NOT EXISTS users_created_at_idx
    ON public.users (created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Пример вставки:
-- INSERT INTO public.users (login_part_1, login_part_2)
-- VALUES ('user@example.com', 'дополнительная часть логина');

-- Если раньше уже создавали таблицу со столбцами login_identifier / login_part_2,
-- проще дропнуть и пересоздать: DROP TABLE IF EXISTS public.users CASCADE;
-- затем снова выполните этот файл с начала.
