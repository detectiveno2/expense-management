const mongoose = require('mongoose');
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
				$and: [{ walletName }, { owner: _id }],
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

module.exports.updateExpense = async (req, res) => {
	const { _id } = req.user;
	const { date, expenseId, isIncome, title, expense, description } = req.body;

	let updatingWallet;

	// Check if expense is not existed.
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

	// Check if user want to update expense of another user.
	if (updatingWallet.owner.toString() !== _id) {
		return res
			.status(FORBIDDEN_STATUS)
			.send('Cannot delete expense of other user.');
	}

	const newExpense = isIncome ? expense : expense * -1;

	// If update is the old day.
	const receivedDate = moment(date).format('MMMM Do YYYY');

	// Cases.
	let expenseCase;

	const foundTransaction = updatingWallet.transactions.find(
		(transaction) =>
			moment(transaction.date).format('MMMM Do YYYY') === receivedDate
	);

	if (!foundTransaction) {
		// Case = 0 if date update is a new day.
		expenseCase = 0;
	} else {
		const foundExpense = foundTransaction.expenses.find(
			(expense) => expense._id.toString() === expenseId
		);

		if (foundExpense) {
			// Case = 1 if date is not change.
			expenseCase = 1;
		}

		if (!foundExpense) {
			// Case = 2 if date update is another existed date.
			expenseCase = 2;
		}
	}

	// Get balance to update.
	let oldExpense;
	for (const transaction of updatingWallet.transactions) {
		for (const expense of transaction.expenses) {
			if (expense._id.toString() === expenseId) {
				oldExpense = expense.expense;
			}
		}
	}

	let justUpdatedWallet;
	let idTransaction;

	switch (expenseCase) {
		case 0:
			await Wallet.updateOne(
				{ 'transactions.expenses._id': expenseId },
				{
					$pull: {
						'transactions.$.expenses': { _id: expenseId },
					},
					$set: {
						accountBalance:
							updatingWallet.accountBalance + newExpense - oldExpense,
					},
				}
			);
			await Wallet.updateOne(
				{ $and: [{ walletName: updatingWallet.walletName }, { owner: _id }] },
				{
					$push: {
						transactions: {
							date,
							expenses: {
								_id: new mongoose.Types.ObjectId(expenseId),
								expense: newExpense,
								isIncome,
								title,
								description,
							},
						},
					},
				}
			);
			// Delete empty transaction after updating.
			justUpdatedWallet = await Wallet.findOne({
				$and: [{ walletName: updatingWallet.walletName }, { owner: _id }],
			});

			for (const tran of justUpdatedWallet.transactions) {
				if (tran.expenses.length === 0) {
					idTransaction = tran._id;
				}
			}

			if (idTransaction) {
				await Wallet.updateOne(
					{ $and: [{ walletName: updatingWallet.walletName }, { owner: _id }] },
					{
						$pull: { transactions: { _id: idTransaction } },
					}
				);
			}
			break;
		case 1:
			let expenseIndex;
			const transactionIndex = updatingWallet.transactions.findIndex(
				(transaction) => {
					for (let i = 0; i < transaction.expenses.length; i++) {
						if (transaction.expenses[i]._id.toString() === expenseId) {
							expenseIndex = i;
							return true;
						}
					}
					return false;
				}
			);

			await Wallet.updateOne(
				{ $and: [{ walletName: updatingWallet.walletName }, { owner: _id }] },
				{
					$set: {
						[`transactions.${transactionIndex}.expenses.${expenseIndex}`]: {
							_id: new mongoose.Types.ObjectId(expenseId),
							isIncome,
							title,
							expense,
							description,
						},
						accountBalance:
							updatingWallet.accountBalance + newExpense - oldExpense,
					},
				}
			);
			break;
		case 2:
			const tranIndex = updatingWallet.transactions.findIndex(
				(transaction) =>
					moment(transaction.date).format('MMMM Do YYYY') === receivedDate
			);

			await Wallet.updateOne(
				{ 'transactions.expenses._id': expenseId },
				{
					$pull: {
						'transactions.$.expenses': { _id: expenseId },
					},
					$push: {
						[`transactions.${tranIndex}.expenses`]: {
							_id: new mongoose.Types.ObjectId(expenseId),
							isIncome,
							title,
							expense,
							description,
						},
					},
					$set: {
						accountBalance:
							updatingWallet.accountBalance + newExpense - oldExpense,
					},
				}
			);

			// Delete empty transaction after updating.
			justUpdatedWallet = await Wallet.findOne({
				$and: [{ walletName: updatingWallet.walletName }, { owner: _id }],
			});

			for (const tran of justUpdatedWallet.transactions) {
				if (tran.expenses.length === 0) {
					idTransaction = tran._id;
				}
			}

			if (idTransaction) {
				await Wallet.updateOne(
					{ $and: [{ walletName: updatingWallet.walletName }, { owner: _id }] },
					{
						$pull: { transactions: { _id: idTransaction } },
					}
				);
			}
			break;
		default:
			break;
	}

	const updatedWallet = await Wallet.findOne({
		$and: [{ walletName: updatingWallet.walletName }, { owner: _id }],
	});
	const wallets = await Wallet.find({ owner: _id });
	// Generate virtual wallet.
	const virtualWallet = {
		accountBalance: getTotalVirtualWallet(wallets),
		owner: _id,
		walletName: 'Tổng cộng',
		transactions: getTransactionsVirtualWallet(wallets),
	};

	return res.status(OK_STATUS).json({ updatedWallet, virtualWallet });
};
