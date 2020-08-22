const router = require('express').Router();

const controller = require('../controllers/wallet.controller');

router.get('/', walletController.index);

module.exports = router;
