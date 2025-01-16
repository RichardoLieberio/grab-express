const jwt = require('jsonwebtoken');
const {db} = require('../models/database');

function isNotAuthenticated(req, res, next) {
    const token = req.cookies.auth;
    if (!token) return next();

    jwt.verify(token, process.env.AUTH_SECRET, (err, decoded) => {
        const {id} = decoded || {};
        if (err || !id) {
            res.clearCookie('auth');
            return next();
        }

        db.query('SELECT id FROM users WHERE id = ?;', [id], (err, result) => {
            if (err) {
                console.error('Error checking user existence', err);
            } else {
                if (result.length) return res.redirect('/');
                res.clearCookie('auth');
                next();
            }
        });
    });
}

module.exports = isNotAuthenticated;