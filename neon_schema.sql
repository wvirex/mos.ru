-- Neon = PostgreSQL. Выполните в SQL Editor в консоли Neon или через psql.
-- Пароли хранятся ТОЛЬКО в виде bcrypt-хеша, никогда в открытом виде.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Уникальный логин пользователя (e-mail / username и т.п.)
    login         TEXT NOT NULL,

    -- bcrypt-хеш пароля (формат: $2a$12$...). Никогда не храните plaintext.
    password_hash TEXT NOT NULL,

    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ,

    CONSTRAINT users_login_nonempty
        CHECK (length(trim(login)) > 0),
    CONSTRAINT users_password_hash_nonempty
        CHECK (length(password_hash) > 0)
);

-- Уникальность логина без учёта регистра.
CREATE UNIQUE INDEX IF NOT EXISTS users_login_unique
    ON public.users (lower(trim(login)));

CREATE INDEX IF NOT EXISTS users_created_at_idx
    ON public.users (created_at DESC);

-- Триггер на автоматическое обновление updated_at.
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

-- =====================================================================
-- Регистрация (вызывается из Worker'а на стороне сервера, не с клиента):
--
-- INSERT INTO public.users (login, password_hash)
-- VALUES (
--     $1,                                  -- login
--     crypt($2, gen_salt('bf', 12))        -- $2 = открытый пароль, хешируется bcrypt
-- )
-- RETURNING id;
--
-- =====================================================================
-- Проверка пароля при логине:
--
-- SELECT id
-- FROM public.users
-- WHERE lower(trim(login)) = lower(trim($1))
--   AND password_hash = crypt($2, password_hash);
--
-- Если запрос вернул строку — пароль верный. Иначе — нет.
-- =====================================================================
-- Смена пароля:
--
-- UPDATE public.users
-- SET password_hash = crypt($2, gen_salt('bf', 12))
-- WHERE id = $1;
-- =====================================================================
