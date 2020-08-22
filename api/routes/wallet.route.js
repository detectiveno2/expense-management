const router = require('express').Router();

const controller = require('../controllers/wallet.controller');

router.get('/', controller.index);

module.exports = router;
