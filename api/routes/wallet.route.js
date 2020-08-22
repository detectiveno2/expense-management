const router = require('express').Router();

const controller = require('../controllers/wallet.controller');

router.get('/', controller.index);

router.post('/add', controller.addWallet);

module.exports = router;
