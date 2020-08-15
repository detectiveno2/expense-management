const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const walletSchema = new Schema({
  walletName: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  transactions: [
    {
      expense: { type: Number, required: true },
      isIncome: { type: Boolean, required: true },
      date: { type: Date, required: true, default: Date.now },
      title: String,
      description: String,
    },
  ],
});

const Wallet = mongoose.model("Wallet", userSchema, "wallets");

module.exports = Wallet;
