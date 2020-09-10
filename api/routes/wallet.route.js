const router = require('express').Router();

const controller = require('../controllers/wallet.controller');

router.get('/', controller.index);
router.post('/add', controller.addWallet);
router.patch('/update/wallet-name', controller.updateWalletName);
router.delete('/:idWallet/delete', controller.deleteWallet);
router.patch('/update/balance', controller.updateBalance);

module.exports = router;
