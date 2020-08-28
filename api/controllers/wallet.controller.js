const Wallet = require('../models/wallet.model');
const User = require('../models/user.model');

const {
	OK_STATUS,
	NOT_FOUND_STATUS,
} = require('../constants/httpStatus.constant');

module.exports.index = async (req, res) => {
	const { _id } = req.user;

	const wallets = await Wallet.find({ owner: _id });

	if (!wallets) {
		res.status(NOT_FOUND_STATUS).send('Wallet not found');
		return;
	}

	res.status(OK_STATUS).send(wallets);
};
