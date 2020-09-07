const router = require('express').Router();

const controller = require('../controllers/wallet.controller');

router.get('/', controller.index);
router.post('/add', controller.addWallet);
router.post('/update/wallet-name', controller.updateWalletName);
router.delete('/:idWallet/delete', controller.deleteWallet);

module.exports = router;
