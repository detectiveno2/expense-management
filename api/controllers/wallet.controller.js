const Wallet = require('../models/wallet.model');
const User = require('../models/user.model');

const {
	OK_STATUS,
	NOT_FOUND_STATUS,
	CREATED_STATUS,
} = require('../constants/httpStatus.constant');

module.exports.index = async (req, res) => {
	const { user } = req;

	const ownerOfWallet = await User.find({ email: user.email });

	const wallet = await Wallet.find({ owner: ownerOfWallet._id });

	if (!wallet) {
		res.status(NOT_FOUND_STATUS).send('Wallet not found');
		return;
	}

	res.status(OK_STATUS).send(wallet);
};

module.exports.addWallet = async (req, res) => {
	const { walletName, owner } = req.body;

	const newWallet = {
		walletName,
		owner,
	};

	// insert new wallet
	await Wallet.insertMany(newWallet);

	// find the wallet just created
	const wallet = await Wallet.find({ walletName });

	res.status(CREATED_STATUS).send(wallet);
};
