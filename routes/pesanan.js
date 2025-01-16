const express = require('express');

const controller = require('../controllers/pesanan');

const routes = express.Router();

routes.get('/', controller.getOrder);
routes.post('/', controller.order);
routes.put('/', controller.updateWholePesanan);
routes.patch('/', controller.updatePesanan);
routes.patch('/swap', controller.swapPesanan);
routes.patch('/delivery', controller.delivery);

module.exports = routes;