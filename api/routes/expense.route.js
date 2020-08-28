const express = require('express');

const router = express.Router();

const controller = require('../controllers/expense.controller');

router.post('/add', controller.addExpense);

module.exports = router;
