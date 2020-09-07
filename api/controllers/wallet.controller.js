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

	res.status(CREATED_STATUS).send(wallet);
};

module.exports.updateWalletName = async (req, res) => {
	const { walletName, newWalletName } = req.body;

	// Find wallet that needs updating.
	const updatingWallet = await Wallet.findOne({ walletName });
	if (!updatingWallet) {
		return res.status(NOT_FOUND_STATUS).send('wallet is not existed.');
	}

	await updatingWallet.updateOne({ $set: { walletName: newWalletName } });

	const updatedWallet = await Wallet.findOne({ walletName: newWalletName });

	return res.status(OK_STATUS).json({ updatedWallet });
};
