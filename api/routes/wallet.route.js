const router = require('express').Router();

const walletController = require('../controllers/wallet.controller');

router.get('/', walletController.index);

module.exports = router;
