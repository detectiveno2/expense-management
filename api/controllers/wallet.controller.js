const Wallet = require('../models/wallet.model');

const {
	OK_STATUS,
	NOT_FOUND_STATUS,
} = require('../constants/httpStatus.constant');

module.exports.index = async (req, res) => {
	const { user } = req;
	const wallet = await Wallet.find({ owner: user.owner });

	if (!waller) {
		res.status(NOT_FOUND_STATUS).send('Wallet not found');
		return;
	}

	res.status(OK_STATUS).send(wallet);
};
