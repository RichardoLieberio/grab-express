const jwt = require('jsonwebtoken');
const {db} = require('../models/database');

function isAuthenticated(req, res, next) {
    const token = req.cookies.auth;
    if (!token) return res.redirect('/login');

    jwt.verify(token, process.env.AUTH_SECRET, (err, decoded) => {
        const {id} = decoded || {};
        if (err || !id) {
            res.clearCookie('auth');
            return res.redirect('/login');
        }

        db.query('SELECT id, name, email, phone FROM users WHERE id = ?', [id], (err, result) => {
            if (err) {
                console.error('Error checking user existence', err);
            } else {
                if (result.length) {
                    req.user = result[0];
                    const query = `
                        SELECT user_payments.id, user_payments.payment_id, user_payments.amount, payments.name, payments.path
                        FROM user_payments
                        JOIN payments ON user_payments.payment_id = payments.id
                        WHERE user_payments.user_id = ?
                    `;
                    db.query(query, [id], (err, results) => {
                        if (err) {
                            console.error('Error fetching user payments', err);
                        } else {
                            req.userPayments = results;
                            next();
                        }
                    });
                } else {
                    res.clearCookie('auth');
                    res.redirect('/login');
                }
            }
        });
    });
}

module.exports = isAuthenticated;