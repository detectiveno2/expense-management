const moment = require('moment');

//virtual wallet
const getTotalVirtualWallet = (wallets) => {
	const total = wallets.reduce(
		(currentTotal, wallet) => currentTotal + wallet.accountBalance,
		0
	);

	return total;
};

const updateVirtualTransactions = (transactions, transaction) => {
	const now = moment(transaction.date).format('MMMM Do YYYY');

	const transactionIndex = transactions.findIndex(
		(obj) => moment(obj.date).format('MMMM Do YYYY') === now
	);

	if (transactionIndex !== -1) {
		transactions[transactionIndex].expenses = transactions[
			transactionIndex
		].expenses.concat(transaction.expenses);
	} else {
		transactions.push(transaction);
	}
};

const getTransactionsVirtualWallet = (wallets) => {
	const transactions = wallets.reduce((currentTransactions, wallet) => {
		wallet.transactions.forEach((transaction) => {
			updateVirtualTransactions(currentTransactions, transaction);
		});
		return currentTransactions;
	}, []);

	return transactions;
};

module.exports = {
	getTotalVirtualWallet,
	updateVirtualTransactions,
	getTransactionsVirtualWallet,
};
