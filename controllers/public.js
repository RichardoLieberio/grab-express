const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const config = require('../config');
const {db} = require('../models/database');
const Pesanan = require('../models/Pesanan');

const daftar_bahasa = require('../data/daftar_bahasa');
const daftarKota = require('../data/daftar_kota');

function renderLogin(req, res) {
    res.render('login', {title: 'Login Page', css: 'login.css', js: 'login.js'});
}

function login(req, res) {
    const {email: rawEmail, password} = req.body;
    const email = rawEmail.trim().toLowerCase();
    const error = {};

    const emailRegex = /^(?!.*\.\.)(?!^\.)(?!.*\.$)(?!.*-$)(?!.*\.-)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)$/;
    if (!email) error.email = 'Email is required'
    else if (email.length > 255) error.email = 'Email length exceeds 255 characters'
    else if (!emailRegex.test(email)) error.email = 'Email is invalid';

    if (!password) error.password = 'Password is required'
    else if (password.length > 255) error.password = 'Password length exceeds 255 characters';

    if (Object.values(error).length) return res.json({status: 422, message: Object.values(error).join('<br>')});

    const query = 'SELECT * FROM users WHERE email = ?;';

    db.query(query, [email], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({status: 500, message: 'Database error'});
        }

        const user = result[0];

        if (!user) {
            console.error('User not found');
            return res.json({status: 401, message: 'Incorrect login credentials'});
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.json({status: 500, message: 'Error comparing passwords'});
            }

            if (!isMatch) return res.json({status: 401, message: 'Incorrect login credentials'});

            const token = jwt.sign({id: user.id}, process.env.AUTH_SECRET, {expiresIn: '1h'});
            res.cookie('auth', token, {
                httpOnly: true,
                maxAge: 60 * 60 * 1000
            });

            return res.json({status: 200, message: 'Login successful'});
        });
    });
}

function renderRegister(req, res) {
    res.render('register', {title: 'Register Page', css: 'register.css', js: 'register.js'});
}

async function register(req, res) {
    const {name: rawName, email: rawEmail, phone: rawPhone, password} = req.body;
    const name = rawName.trim().replace(/\s+/g, ' ');
    const email = rawEmail.trim().toLowerCase();
    const phone = rawPhone.trim();
    const error = {};

    if (!name) error.name = 'Name is required'
    else if (name.length > 255) error.name = 'Name length exceeds 255 characters';

    const emailRegex = /^(?!.*\.\.)(?!^\.)(?!.*\.$)(?!.*-$)(?!.*\.-)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)$/;
    if (!email) error.email = 'Email is required'
    else if (email.length > 255) error.email = 'Email length exceeds 255 characters'
    else if (!emailRegex.test(email)) error.email = 'Email is invalid';

    if (!phone) error.phone = 'Phone is required'
    else if (phone.length > 13) error.phone = 'Phone length exceeds 13 characters'
    else if (!/^[0-9]+$/.test(phone)) error.phone = 'Phone is invalid';

    if (!password) error.password = 'Password is required'
    else if (password.length > 255) error.password = 'Password length exceeds 255 characters';

    if (!error.email || !error.phone) {
        try {
            const [users] = await db.promise().query('SELECT id, email, phone FROM users WHERE email = ? OR phone = ?', [email, phone]);
            users.forEach((user) => {
                if (user.email === email) error.email = 'Email is already in use';
                if (user.phone === phone) error.phone = 'Phone is already in use';
            });
        } catch (err) {
            console.error('Error checking user existence:', err);
            return res.json({status: 500, message: 'Error checking user existence'});
        }
    }

    if (Object.values(error).length) return res.json({status: 422, message: Object.values(error).join('<br>')});

    const query = 'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?);';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(query, [name, email, phone, hashedPassword], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({status: 500, message: 'Database error'});
        }

        db.query('SELECT id, name FROM payments', (err, results) => {
            let completed = 0;

            results.forEach((result) => {
                const amount = (result.name === 'Sender' || result.name === 'Recipient') ? null : 200000;
                db.query('INSERT INTO user_payments (user_id, payment_id, amount) VALUES (?, ?, ?)', [user.insertId, result.id, amount], (err, _) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.json({status: 500, message: 'Database error'});
                    }
                    if (++completed === results.length) res.json({status: 201, message: 'Register successful'});
                });
            });
        });
    });
}

function renderMain(req, res) {
    const language = config.language === 'en' ? daftar_bahasa.en : daftar_bahasa.id;
    const options = {
        daftarKota,
        language,
        geocoding_api: config.geocoding_api,
        default_lat: config.default_lat,
        default_long: config.default_long,
        firstOrder: Pesanan.getFirstOrder(),
        twoHistory: [], // Ini diedit
        user: req.user
    };
    res.render('main', {title: 'Home Page', css: 'main.css', js: 'main.js', ...options});
}

function renderPemesanan(req, res) {
    const language = config.language === 'en' ? daftar_bahasa.en : daftar_bahasa.id;
    res.render('pemesanan', {title: 'Pemesanan', css: 'pemesanan.css', js: 'pemesanan.js', language, user: req.user});
}

function renderPemesananGanda(req, res) {
    const language = config.language === 'en' ? daftar_bahasa.en : daftar_bahasa.id;
    const options = {
        language,
        geocoding_api: config.geocoding_api,
        default_lat: config.default_lat,
        default_long: config.default_long,
        allOrder: Pesanan.pesanan,
        max_weight: config.max_weight,
        disableTotal: Pesanan.disableTotal(),
        user: req.user,
        payments: req.userPayments
    }
    res.render('pemesanan-ganda', {title: 'Pemesanan Ganda', css: 'pemesanan-ganda.css', js: 'pemesanan-ganda.js', ...options});
}

function renderDashboard(req, res) {
    if (!req.user.driver) return res.redirect('/');
    const language = config.language === 'en' ? daftar_bahasa.en : daftar_bahasa.id;
    res.render('dashboard', {title: 'Dashboard Page', css: 'dashboard.css', js: 'dashboard.js', language, user: req.user});
}

function logout(req, res) {
    Pesanan.clearPesanan();
    res.clearCookie('auth');
    res.json({status: 200, message: 'You have logged out'});
}

module.exports = {renderLogin, login, renderRegister, register, renderMain, renderPemesanan, renderPemesananGanda, renderDashboard, logout};