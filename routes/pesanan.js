const express = require('express');

const isAuthenticated = require('../middlewares/isAuthenticated');
const checkDriver = require('../middlewares/checkDriver');
const controller = require('../controllers/pesanan');

const routes = express.Router();

routes.use(isAuthenticated);
routes.use(checkDriver);

routes.get('/', controller.getOrder);
routes.post('/', controller.order);
routes.put('/', controller.updateWholePesanan);
routes.patch('/', controller.updatePesanan);
routes.get('/orders', controller.getOrders);
routes.patch('/swap', controller.swapPesanan);
routes.patch('/delivery', controller.delivery);
routes.patch('/cancel/:no_resi', controller.cancel);

module.exports = routes;