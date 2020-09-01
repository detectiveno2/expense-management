const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const walletSchema = new Schema({
	walletName: { type: String, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'User' },
	transactions: [
		{
			_id: Schema.Types.ObjectId,
			date: {
				type: Date,
				require: true,
				default: Date.now,
			},
			expenses: [
				{
					expense: { type: Number, required: true },
					isIncome: { type: Boolean, required: true },
					title: String,
					description: String,
				},
			],
		},
	],
	accountBalance: { type: Number, default: 0 },
});

const Wallet = mongoose.model('Wallet', walletSchema, 'wallets');

module.exports = Wallet;
