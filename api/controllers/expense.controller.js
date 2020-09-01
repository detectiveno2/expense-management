const Wallet = require('../models/wallet.model');

const moment = require('moment');

module.exports.addExpense = async (req, res) => {
	const { expense, isIncome, title, description, walletName } = req.body;
	const { _id } = req.user;
	const now = moment().format('MMMM Do YYYY');

	// get a latest transaction
	const wallet = await Wallet.findOne({
		$and: [{ walletName }, { owner: _id }],
	});
	const transaction = wallet.transactions[wallet.transactions.length - 1];

	// if transaction on the same day
	if (moment(transaction.date).format('MMMM Do YYYY') === now) {
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
						expense,
						isIncome,
						title,
						description,
					},
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
					['transaction.$.expenses']: {
						expense,
						isIncome,
						title,
						description,
					},
				},
			}
		);

	const newData = await Wallet.findOne({
		$and: [{ walletName }, { owner: _id }],
		transactions: {
			$elemMatch: {
				_id: transaction._id,
			},
		},
	});

	return res.json(newData);
};
