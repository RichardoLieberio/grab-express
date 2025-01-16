const registerForm = document.querySelector('#register-form');
const name = document.querySelector('#name');
const email = document.querySelector('#email');
const phone = document.querySelector('#phone');
const password = document.querySelector('#password');
const error = document.querySelector('#error');

registerForm.addEventListener('submit', async function(e) {
    try {
        e.preventDefault();
        error.classList.add('d-none');

        const data = {
            name: name.value,
            email: email.value,
            phone: phone.value,
            password: password.value
        };

        const response = await fetch('/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === 422 || result.status === 500) {
            error.innerHTML = result.message;
            error.classList.remove('d-none');
        } else if (result.status === 201) {
            alert(result.message);
            location.href = '/login';
        }
    } catch (err) {
        console.error(err);
    }
});