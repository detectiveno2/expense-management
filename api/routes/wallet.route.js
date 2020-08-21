const router = require('express').Router();

const walletController = require('../controllers/');

router.get('/:ownerId', walletController.index);

exports.default = router;
