const router = require('express').Router();

const walletController = require('../controllers/');

router.get('/', walletController.index);

module.exports = router;
