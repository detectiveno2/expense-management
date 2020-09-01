const Wallet = require('../models/wallet.model');

const moment = require('moment');

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
					transactions: {
						date,
						expenses: {
							expense,
							isIncome,
							title,
							description,
						},
					},
				},
			}
		);

	const newData = await Wallet.findOne({
		$and: [{ walletName }, { owner: _id }],
	});

	return res.json(newData);
};
