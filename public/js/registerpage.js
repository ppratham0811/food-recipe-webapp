const headLogin = document.querySelector('#head-login');
const headSignup = document.querySelector('#head-signup');

let loginForm = document.querySelector('#login-form');
let signupForm = document.querySelector('#signup-form');
let btn = document.querySelector('#btn');

const signup = function() {
    btn.style.left = '110px';
    signupForm.style.left = '0';
    loginForm.style.left = '-380px';
}

const login = function() {
    btn.style.left = '0';
    signupForm.style.left = '380px';
    loginForm.style.left = '0';
}

headLogin.addEventListener('click',login);
headSignup.addEventListener('click',signup);