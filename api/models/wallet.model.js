const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const walletSchema = new Schema({
  walletName: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  transactions: [
    {
      expense: Number,
      isIncome: Boolean,
      title: String,
      description: String
    }
  ]
})

const Wallet = mongoose.model('Wallet', userSchema, 'wallets');

module.exports = Wallet;

