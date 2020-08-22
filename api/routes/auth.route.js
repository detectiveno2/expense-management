const express = require('express');
const router = express.Router();

const controller = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware.checkAuth, controller.index);
router.post('/register', controller.postRegister);
router.post('/login', controller.postLogin);
router.post('/facebook', controller.facebook);
router.post('/google', controller.google);

module.exports = router;
