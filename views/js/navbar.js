const newLanguage2 = document.getElementById('new-language2');
const logout2 = document.getElementById('logout2');

newLanguage2.addEventListener('click', function changeLanguage() {
    fetch('/api/config/change-language', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        data.success && location.reload();
    })
});

logout2.addEventListener('click', async function() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        const result = await response.json();
        if (result.status === 200) {
            alert(result.message);
            location.href = '/login';
        }
    } catch(err) {
        console.error(err);
    }
});