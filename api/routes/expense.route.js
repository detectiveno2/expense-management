const express = require('express');

const router = express.Router();

const controller = require('../controllers/expense.controller');

router.post('/add', controller.addExpense);
router.patch('/update', controller.updateExpense);
router.delete('/:expenseId/delete', controller.deleteExpense);

module.exports = router;
