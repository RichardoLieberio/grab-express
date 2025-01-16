const Pesanan = require('../models/Pesanan');

function getOrder(req, res) {
    res.json({success: true, data: Pesanan.orders});
}

async function order(req, res) {
    const error = await Pesanan.order();
    res.json({success: true, error});
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