const {db} = require('../models/database');

function checkDriver(req, res, next) {
    db.query('SELECT id FROM drivers WHERE user_id = ?', [req.user.id], (err, result) => {
        if (err) {
            console.error('Error checking driver:', err);
        } else {
            req.user.driver = result.length ? true : false;
            next();
        }
    });
}

module.exports = checkDriver;