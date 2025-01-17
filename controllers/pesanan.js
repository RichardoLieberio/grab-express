const {db} = require('../models/database');
const Pesanan = require('../models/Pesanan');

function getOrder(req, res) {
    const query = `
        SELECT drivers.*, users.name AS driver_name, users.email AS driver_email, users.phone AS driver_phone, user_payments.payment_id, payments.name AS payment_name, payments.path AS payment_path, order_details.*, orders.*
        FROM orders
        LEFT JOIN drivers ON orders.driver_id = drivers.id
        LEFT JOIN users ON drivers.user_id = users.id
        JOIN user_payments ON orders.user_payment_id = user_payments.id
        JOIN payments ON user_payments.payment_id = payments.id
        JOIN order_details ON orders.order_detail_id = order_details.id
        WHERE orders.user_id = ?
    `;

    db.query(query, [req.user.id], (err, result) => {
        if (err) {
            console.error(err);
            res.json({success: false, message: 'Failed to fetch orders'});
        } else {
            res.json({success: true, data: result});
        }
    })
}

async function order(req, res) {
    const error = await Pesanan.order(req.user.id);
    error === 500 ? res.json({success: false, message: 'Database error'}) : res.json({success: true, error});
}

function updateWholePesanan(req, res) {
    const error = Pesanan.updateWholePesanan(req.body);
    res.json({success: true, error});
}

async function updatePesanan(req, res) {
    const {long, lat, loc, type, no} = req.body;

    Pesanan.updateOrderByMaps(long, lat, loc, type, no);
    const max = await Pesanan.getDistance(no);
    if (max) return res.json({success: true, max});

    const price = Pesanan.getPrice(no);
    const instantPrice = Pesanan.getEstPrice(no, 'instant');
    const sameDayPrice = Pesanan.getEstPrice(no, 'same_day');
    const detailPrice = Pesanan.getDetailPrice(no);
    const option = Pesanan.getOption(no);
    const distance = Pesanan.getDistanceValue(no);

    res.json({success: true, price, instantPrice, sameDayPrice, option, detailPrice, distance});
}

async function swapPesanan(req, res) {
    Pesanan.swapOrder(req.body.no);
    const max = await Pesanan.getDistance(req.body.no);
    if (max) return res.json({success: true, max: true});

    const price = Pesanan.getPrice(req.body.no);
    const instantPrice = Pesanan.getEstPrice(req.body.no, 'instant');
    const sameDayPrice = Pesanan.getEstPrice(req.body.no, 'same_day');
    const option = Pesanan.getOption(req.body.no);
    const distance = Pesanan.getDistanceValue(req.body.no);

    res.json({success: true, price, instantPrice, sameDayPrice, option, distance});
}

function delivery(req, res) {
    const {no, type} = req.body;

    Pesanan.chooseDelivery(no, type);
    const price = Pesanan.getPrice(no);

    res.json({success: true, price});
}

module.exports = {getOrder, order, updateWholePesanan, updatePesanan, swapPesanan, delivery};