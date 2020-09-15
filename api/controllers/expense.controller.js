const moment = require('moment');

const Wallet = require('../models/wallet.model');
const {
	CREATED_STATUS,
	NOT_FOUND_STATUS,
	FORBIDDEN_STATUS,
	OK_STATUS,
} = require('../constants/httpStatus.constant');
const {
	getTotalVirtualWallet,
	updateVirtualTransactions,
	getTransactionsVirtualWallet,
} = require('../helper/helper');

module.exports.addExpense = async (req, res) => {
	const { date, expense, isIncome, title, description, walletName } = req.body;
	const { _id } = req.user;
	const now = moment(date).format('MMMM Do YYYY');

	// Find transactions with the same date
	const wallet = await Wallet.findOne({
		$and: [{ walletName }, { owner: _id }],
	});

	const transactionIndex = wallet.transactions.findIndex(
		(obj) => moment(obj.date).format('MMMM Do YYYY') === now
	);

	const currentAccountBalance = wallet.accountBalance;
	const newExpense = (isIncome && expense) || -expense;
	let transaction;

	// if transaction on the same day
	if (transactionIndex !== -1) {
		transaction = wallet.transactions[transactionIndex];
		await Wallet.updateOne(
			{
				$and: [{ walletName }, { owner: _id }],
				transactions: {
					$elemMatch: {
						_id: transaction._id,
					},
				},
			},
			{
				$push: {
					['transactions.$.expenses']: {
						expense: newExpense,
						isIncome,
						title,
						description,
					},
				},
				$set: {
					accountBalance: currentAccountBalance + newExpense,
				},
			}
		);
	} else
		await Wallet.updateOne(
			{
				$and: [{ walletName }, { owner: _id }],
			},
			{
				$push: {
					transactions: {
						date,
						expenses: {
							expense: newExpense,
							isIncome,
							title,
							description,
						},
					},
				},
				$set: {
					accountBalance: currentAccountBalance + newExpense,
				},
			}
		);

	await Wallet.updateOne({});

	const newData = await Wallet.findOne({
		$and: [{ walletName }, { owner: _id }],
	});

	//get wallets
	const wallets = await Wallet.find({ owner: _id });

	//generate virtual wallet
	const virtualWallet = {
		accountBalance: getTotalVirtualWallet(wallets),
		owner: _id,
		walletName: 'Tổng cộng',
		transactions: getTransactionsVirtualWallet(wallets),
	};

	return res.status(CREATED_STATUS).send({ newData, virtualWallet });
};

module.exports.updateExpense = async (req, res) => {
	res.json('hey');
};

module.exports.deleteExpense = async (req, res) => {
	const { _id } = req.user;
	const { expenseId } = req.params;

	// Check wallet need updating.
	let updatingWallet;
	try {
		updatingWallet = await Wallet.findOne({
			'transactions.expenses._id': expenseId,
		});
	} catch (error) {
		return res.status(NOT_FOUND_STATUS).send('Expense is not existed.');
	}
	if (!updatingWallet) {
		return res.status(NOT_FOUND_STATUS).send('Expense is not existed.');
	}

	// Check if this user want to delete expense of that user.
	if (updatingWallet.owner.toString() !== _id) {
		return res
			.status(FORBIDDEN_STATUS)
			.send('Cannot delete expense of other user.');
	}

	// Get expense to update accountBalance.
	let balance = 0;

	for (const tran of updatingWallet.transactions) {
		for (const expense of tran.expenses) {
			if (expense._id.toString() === expenseId) {
				balance = expense.expense;
			}
		}
	}

	// Get walletName to query after update.
	const walletName = updatingWallet.walletName;

	// Delete expense.
	await Wallet.updateMany(
		{ 'transactions.expenses._id': expenseId },
		{
			$pull: {
				'transactions.$.expenses': { _id: expenseId },
			},
			$set: {
				accountBalance: updatingWallet.accountBalance - balance,
			},
		}
	);

	// Return data.
	const justUpdatedWallet = await Wallet.findOne({ walletName });
	const wallets = await Wallet.find({ owner: _id });

	// Delete transaction that contain empty expenses.
	let idTransaction;

	for (const tran of justUpdatedWallet.transactions) {
		if (tran.expenses.length === 0) {
			idTransaction = tran._id;
		}
	}

	if (idTransaction) {
		updateWallet = await Wallet.updateOne(
			{
				walletName,
			},
			{
				$pull: { transactions: { _id: idTransaction } },
			}
		);
	}

	const updatedWallet = await Wallet.findOne({ walletName });

	// Generate virtual wallet.
	const virtualWallet = {
		accountBalance: getTotalVirtualWallet(wallets),
		owner: _id,
		walletName: 'Tổng cộng',
		transactions: getTransactionsVirtualWallet(wallets),
	};

	return res.status(OK_STATUS).json({ updatedWallet, virtualWallet });
};
