const router = require('express').Router();

const walletController = require('../controllers/wallet.controller');

router.get('/:ownerId', walletController.index);

module.exports = router;
