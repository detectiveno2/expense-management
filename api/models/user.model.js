const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
	email: String,
	userName: { type: String, required: true },
	password: String,
	socialId: String,
	wallets: [
		{
			_id: { type: Schema.Types.ObjectId, ref: 'Wallet' },
			walletName: { type: String, required: true },
		},
	],
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
