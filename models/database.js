const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

function connectDB() {
    return new Promise((resolve, reject) => {
        db.connect((err) => {
            if (err) {
                console.error('Database connection failed');
                reject(err);
            } else {
                console.log('Database connected');
                resolve();
            }
        });
    });
}

module.exports = {db, connectDB};
