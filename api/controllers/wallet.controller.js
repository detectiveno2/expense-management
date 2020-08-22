const Wallet = require('../models/wallet.model');
const User = require('../models/user.model');

const {
	OK_STATUS,
	NOT_FOUND_STATUS,
} = require('../constants/httpStatus.constant');

module.exports.index = async (req, res) => {
	const { user } = req;

	const ownerOfWaller = await User.find({ email: user.email });

	const wallet = await Wallet.find({ owner: ownerOfWaller._id });

	if (!wallet) {
		res.status(NOT_FOUND_STATUS).send('Wallet not found');
		return;
	}

	res.status(OK_STATUS).send(wallet);
};
