const inputPassword = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

// Affichager et masques le mot de passe
togglePassword.addEventListener("click",showPassword);
const eyeOpen = toggle.innerHTML;
const eyeClosed = `<i class="bi bi-eye-slash-fill"></i>`;

function showPassword() {
    const type = inputPassword.type === 'password' ? 'text' : 'password';
    inputPassword.type = type;

    if(type === 'password'){
        togglePassword.innerHTML = eyeOpen;
    }
    else{
        togglePassword.innerHTML = eyeClosed;
    }
}