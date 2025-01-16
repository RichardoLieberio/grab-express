const express = require('express');

const isNotAuthenticated = require('../middlewares/isNotAuthenticated');
const isAuthenticated = require('../middlewares/isAuthenticated');
const checkDriver = require('../middlewares/checkDriver');
const controller = require('../controllers/public');

const routes = express.Router();

routes.get('/login', isNotAuthenticated, controller.renderLogin);
routes.post('/login', isNotAuthenticated, controller.login);
routes.get('/register', isNotAuthenticated, controller.renderRegister);
routes.post('/register', isNotAuthenticated, controller.register);

routes.use(isAuthenticated);
routes.use(checkDriver);
routes.get('/', controller.renderMain);
routes.get('/pemesanan', controller.renderPemesanan);
routes.get('/pemesanan-ganda', controller.renderPemesananGanda);
routes.get('/dashboard', controller.renderDashboard);
routes.post('/logout', controller.logout);

module.exports = routes;