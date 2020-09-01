const Wallet = require('../models/wallet.model');

module.exports.addExpense = async (req, res) => {
	const { expense, isIncome, title, description } = req.body;
	const { _id } = req.user;

	await Wallet.updateOne(
		{
			owner: _id,
		},
		{
			$push: {
				transactions: {
					expense,
					isIncome,
					title,
					description,
				},
			},
		}
	);

	const wallet = await Wallet.find({ owner: _id });

	console.log({ _id });
	console.log({ wallet });

	return res.json({ wallet });
};
