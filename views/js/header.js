const profile = document.getElementById('profile');
const profileMenu = document.getElementById('profile-menu');
const language = document.getElementById('language');
const languageOption = document.getElementById('language-option');
const newLanguage = document.getElementById('new-language');
const logout = document.getElementById('logout');

let hideTimeout;

newLanguage.addEventListener('click', changeLanguage);

profile.addEventListener('mouseenter', function() {
    clearTimeout(hideTimeout);
    profileMenu.style.display = 'block';
});

profile.addEventListener('mouseleave', function() {
    hideTimeout = setTimeout(function() {
        profileMenu.style.display = 'none';
        languageOption.style.display = 'none';
    }, 500);
});

document.querySelectorAll('#profile-menu > .dropdown-item').forEach(function(item) {
    item.addEventListener('click', function() {
        profileMenu.style.display = 'none';
        languageOption.style.display = 'none';
    });

    if (item !== language) {
        item.addEventListener('mouseenter', function() {
            languageOption.style.display = 'none';
        });
    }
});

language.addEventListener('mouseenter', function() {
    languageOption.style.display = 'inline-block';
});

languageOption.addEventListener('mouseleave', function() {
    languageOption.style.display = 'none';
});

logout.addEventListener('click', async function() {
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

function changeLanguage() {
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
}