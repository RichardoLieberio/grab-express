const loginForm = document.querySelector('#login-form');
const email = document.querySelector('#email');
const password = document.querySelector('#password');
const error = document.querySelector('#error');

loginForm.addEventListener('submit', async function(e) {
    try {
        e.preventDefault();
        error.classList.add('d-none');

        const data = {
            email: email.value,
            password: password.value
        };

        const response = await fetch('/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === 401 || result.status === 422 || result.status === 500) {
            error.innerHTML = result.message;
            error.classList.remove('d-none');
        } else if (result.status === 200) {
            alert(result.message);
            location.href = '/';
        }
    } catch (err) {
        console.error(err);
    }
});