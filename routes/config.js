const express = require('express');

const controller = require('../controllers/config');

const routes = express.Router();

routes.post('/change-language', controller.change_lang);

module.exports = routes;