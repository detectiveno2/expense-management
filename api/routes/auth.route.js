const express = require('express');
const router = express.Router();

const controller = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware.checkAuth, controller.index);
router.post('/register', controller.postRegister);
router.post('/login', controller.postLogin);
router.post('/facebook', controller.facebook);
router.post('/google', controller.google);
router.post(
	'/change-password',
	authMiddleware.checkAuth,
	controller.changePassword
);

module.exports = router;
