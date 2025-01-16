const config = require('../config');

async function change_lang(req, res) {
    // const randomTime = 100 + Math.random() * 50 * 100;
    // await setTimeout(function() {
        config.change_lang();
    // }, randomTime);
    res.json({success: true});
}

module.exports = {change_lang};