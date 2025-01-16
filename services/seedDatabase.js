const bcrypt = require('bcryptjs');
const {faker} = require('@faker-js/faker');
const {db} = require('../models/database');

function dropDB() {
    return new Promise((resolve, reject) => {
        db.query('DROP DATABASE IF EXISTS uas', (err) => {
            if (err) {
                console.error('Failed to drop database');
                reject(err);
            } else {
                console.log('Database dropped');
                resolve();
            }
        });
    });
}

function createAndUseDB() {
    return new Promise((resolve, reject) => {
        db.query('CREATE DATABASE IF NOT EXISTS uas', (err) => {
            if (err) {
                console.error('Failed to create database');
                reject(err);
            } else {
                console.log('Database "uas" created or already exists');
                db.query('USE uas', (err) => {
                    if (err) {
                        console.error('Failed to use database');
                        reject(err);
                    } else {
                        console.log('Using database "uas"');
                        resolve();
                    }
                });
            }
        });
    });
}

function createTable() {
    return new Promise((resolve, reject) => {
        const sql = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT(11) AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(13) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS drivers (
                id INT(11) AUTO_INCREMENT PRIMARY KEY,
                user_id INT(11) NOT NULL,
                rating DECIMAL(3, 2) NOT NULL,
                plat VARCHAR(11) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS payments (
                id INT(11) AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(30) NOT NULL,
                path VARCHAR(30) NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS user_payments (
                id INT(11) AUTO_INCREMENT PRIMARY KEY,
                user_id INT(11) NOT NULL,
                payment_id INT(11) NOT NULL,
                amount DECIMAL(11, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE ON UPDATE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS order_details (
                id INT(11) AUTO_INCREMENT PRIMARY KEY,
                pickup_lat DECIMAL(9, 6) NOT NULL,
                pickup_long DECIMAL(9, 6) NOT NULL,
                pickup_loc VARCHAR(255) NOT NULL,
                pickup_detail TEXT,
                destination_lat DECIMAL(9, 6) NOT NULL,
                destination_long DECIMAL(9, 6) NOT NULL,
                destination_loc VARCHAR(255) NOT NULL,
                destination_detail TEXT,
                sender_name VARCHAR(255) NOT NULL,
                sender_phone VARCHAR(13) NOT NULL,
                recipient_name VARCHAR(255) NOT NULL,
                recipient_phone VARCHAR(13) NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS orders (
                no_resi CHAR(20) PRIMARY KEY,
                user_id INT(11) NOT NULL,
                driver_id INT(11) NOT NULL,
                user_payment_id INT(11) NOT NULL,
                order_detail_id INT(11) NOT NULL,
                item_size ENUM("s", "m", "l") NOT NULL,
                item_weight INT(3) NOT NULL,
                item_type INT(1) NOT NULL,
                delivery_option ENUM("instant", "same_day") NOT NULL,
                delivery_vehicle ENUM("bike", "car") NOT NULL,
                distance DECIMAL(6, 2) NOT NULL,
                price DECIMAL(11, 2) NOT NULL,
                status INT(1) NOT NULL,
                time TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (user_payment_id) REFERENCES user_payments(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (order_detail_id) REFERENCES order_details(id) ON DELETE CASCADE ON UPDATE CASCADE
            )`
        ];
        let completed = 0;

        sql.forEach((query) => {
            db.query(query, (err) => {
                if (err) {
                    console.error('Error creating table');
                    reject(err);
                } else {
                    if (++completed === sql.length) {
                        console.log('Tables created successfully');
                        resolve();
                    }
                }
            });
        });
    });
}

async function seedUser() {
    return new Promise(async (resolve, reject) => {
        const driverPassword = await bcrypt.hash('driver', 10);
        const users = [];

        for (let i = 0; i < 20; i++) {
            users.push({
                name: faker.person.fullName(),
                email: faker.internet.email().toLowerCase(),
                phone: '08' + String(faker.number.int({min: 1000000000, max: 9999999999})),
                password: driverPassword
            });
        }

        const insertQuery = 'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)';
        let completed = 0;

        users.forEach((user) => {
            db.query(insertQuery, [user.name, user.email, user.phone, user.password], (err) => {
                if (err) {
                    console.error('Error inserting user');
                    reject(err);
                } else {
                    if (++completed === users.length) {
                        console.log('Users inserted successfully');
                        resolve();
                    }
                }
            });
        });
    });
}

function seedPayment() {
    return new Promise(async (resolve, reject) => {
        const query = 'INSERT INTO payments (name, path) VALUES (?, ?)';
        const payments = [
            {name: 'Ovo', path: 'Ovo.svg'},
            {name: 'Mastercard', path: 'Mastercard.svg'},
            {name: 'Visa', path: 'Visa.png'},
            {name: 'Sender', path: 'Cash.svg'},
            {name: 'Recipient', path: 'Cash.svg'}
        ];
        let completed = 0;

        payments.forEach((payment) => {
            db.query(query, [payment.name, payment.path], (err) => {
                if (err) {
                    console.error('Error inserting payment');
                    reject(err);
                } else {
                    if (++completed === payments.length) {
                        console.log('Payment inserted successfully');
                        resolve();
                    }
                }
            });
        });
    });
}

function seedUserPayment() {
    return new Promise(async (resolve, reject) => {
        db.query('SELECT id FROM users', (err, users) => {
            if (err) {
                console.error('Error fetching users:', err);
                process.exit();
            } else {
                db.query('SELECT id, name FROM payments', (err, payments) => {
                    if (err) {
                        console.error('Error fetching payments:', err);
                        process.exit();
                    } else {
                        const query = 'INSERT INTO user_payments (user_id, payment_id, amount) VALUES (?, ?, ?)';
                        let completed = 0;

                        users.forEach(({id: user_id}) => {
                            payments.forEach(({id: payment_id, name}) => {
                                const amount = (name === 'Sender' || name === 'Recipient') ? null : 200000;
                                db.query(query, [user_id, payment_id, amount], (err) => {
                                    if (err) {
                                        console.error('Error inserting user payment');
                                        reject(err);
                                    } else {
                                        if (++completed === users.length * payments.length) {
                                            console.log('User payment inserted successfully');
                                            resolve();
                                        }
                                    }
                                });
                            });
                        });
                    }
                });
            }
        });
    });
}

function seedDriver() {
    function getPlat() {
        const platPrefix = Math.random() > 0.5 ? 'BK' : 'B';
        const randomDigits = String(faker.number.int({min: 2000, max: 9999}));
        const randomLetters = faker.string.alpha({length: Math.random() > 0.5 ? 2 : 3}).toUpperCase()
        return `${platPrefix} ${randomDigits} ${randomLetters}`;
    }

    return new Promise(async (resolve, reject) => {
        db.query('SELECT id FROM users', (err, users) => {
            if (err) {
                console.error('Error fetching users:', err);
                process.exit();
            } else {
                const query = 'INSERT INTO drivers (user_id, rating, plat) VALUES (?, ?, ?)';
                let completed = 0;

                users.forEach(({id: user_id}) => {
                    const rating = (Math.random() * (5 - 2) + 2).toFixed(2);
                    const plat = getPlat();

                    db.query(query, [user_id, rating, plat], (err) => {
                        if (err) {
                            console.error('Error inserting driver');
                            reject(err);
                        } else {
                            if (++completed === users.length) {
                                console.log('Driver inserted successfully');
                                resolve();
                            }
                        }
                    });
                });
            }
        });
    });
}

module.exports = {dropDB, createAndUseDB, createTable, seedUser, seedPayment, seedUserPayment, seedDriver};