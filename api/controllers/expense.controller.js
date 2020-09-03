const moment = require('moment');

const Wallet = require('../models/wallet.model');
const { CREATED_STATUS } = require('../constants/httpStatus.constant');
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
