const Wallet = require('../models/wallet.model');
const User = require('../models/user.model');

const {
	OK_STATUS,
	NOT_FOUND_STATUS,
	CREATED_STATUS,
	BAD_REQUEST_STATUS,
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
	const { walletName } = req.body;
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
	};

	// insert new wallet
	await Wallet.insertMany(newWallet);

	// find the wallet just created
	const wallet = await Wallet.find({ walletName });

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
