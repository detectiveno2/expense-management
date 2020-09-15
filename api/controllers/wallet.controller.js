const moment = require('moment');
const Wallet = require('../models/wallet.model');
const User = require('../models/user.model');

const {
	OK_STATUS,
	NOT_FOUND_STATUS,
	CREATED_STATUS,
	BAD_REQUEST_STATUS,
} = require('../constants/httpStatus.constant');

const {
	getTotalVirtualWallet,
	getTransactionsVirtualWallet,
} = require('../helper/helper');

module.exports.index = async (req, res) => {
	const { _id } = req.user;

	const wallets = await Wallet.find({ owner: _id });

	if (!wallets) {
		return res.status(NOT_FOUND_STATUS).send('Wallet not found');
	}

	//generate virtual wallet
	const virtualWallet = {
		accountBalance: getTotalVirtualWallet(wallets),
		owner: _id,
		walletName: 'Tổng cộng',
		transactions: getTransactionsVirtualWallet(wallets),
	};

	return res.status(OK_STATUS).send({ wallets, virtualWallet });
};

module.exports.addWallet = async (req, res) => {
	const { walletName, accountBalance } = req.body;
	const { _id } = req.user;

	// Check if the wallet is available
	const user = await User.findOne({ _id });

	const checkWallet = user.wallets.filter(
		(wallet) => wallet.walletName === walletName
	);

	if (checkWallet.length > 0) {
		return res.status(BAD_REQUEST_STATUS).send('Wallet has already exists');
	}

	const newWallet = {
		walletName,
		owner: _id,
		transactions: [],
		accountBalance,
	};

	// insert new wallet
	await Wallet.insertMany(newWallet);

	// find the wallet just created
	const wallet = await Wallet.findOne({
		$and: [
			{
				walletName,
			},
			{
				owner: _id,
			},
		],
	});

	await User.updateMany(
		{
			_id: _id,
		},
		{
			$push: {
				wallets: { _id: wallet._id, walletName: wallet.walletName },
			},
		}
	);

	//generate virtual wallet
	const wallets = await Wallet.find({ owner: _id });
	const virtualWallet = {
		accountBalance: getTotalVirtualWallet(wallets),
		owner: _id,
		walletName: 'Tổng cộng',
		transactions: getTransactionsVirtualWallet(wallets),
	};

	return res.status(CREATED_STATUS).json({ wallet, virtualWallet });
};

module.exports.updateWalletName = async (req, res) => {
	const { _id } = req.user;
	const { walletName, newWalletName } = req.body;

	// Find wallet that needs updating.
	const updatingWallet = await Wallet.findOne({ walletName });
	if (!updatingWallet) {
		return res.status(NOT_FOUND_STATUS).send('wallet is not existed.');
	}

	// update field.
	const user = await User.findOne({ _id });
	await updatingWallet.updateOne({ $set: { walletName: newWalletName } });
	await user.updateOne({
		$set: {
			[`wallets.${user.wallets.findIndex(
				(wallet) => wallet.walletName === walletName
			)}.walletName`]: newWalletName,
		},
	});

	const updatedWallet = await Wallet.findOne({ walletName: newWalletName });

	return res.status(OK_STATUS).json({ updatedWallet });
};

module.exports.deleteWallet = async (req, res) => {
	const { _id } = req.user;
	const { idWallet } = req.params;

	try {
		await Wallet.deleteOne({ _id: idWallet });
	} catch (error) {
		return res.status(NOT_FOUND_STATUS).send('wallet is not existed.');
	}

	// Update wallets field in user.
	const user = await User.findOne({ _id });
	await user.updateOne({ $pull: { wallets: { _id: idWallet } } });

	//generate virtual wallet
	const wallets = await Wallet.find({ owner: _id });
	const virtualWallet = {
		accountBalance: getTotalVirtualWallet(wallets),
		owner: _id,
		walletName: 'Tổng cộng',
		transactions: getTransactionsVirtualWallet(wallets),
	};

	return res.status(OK_STATUS).json({ wallets, virtualWallet });
};

module.exports.updateBalance = async (req, res) => {
	const {
		date,
		expense,
		isIncome,
		title,
		walletName,
		description,
		isShowReport,
	} = req.body;
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
						isShowReport,
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
							isShowReport,
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
