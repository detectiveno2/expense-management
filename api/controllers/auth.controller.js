const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

module.exports.postRegister = async (req, res) => {
	const { email, password } = req.body;

	//Check if the user exists
	const existingUser = User.findOne({ email });
	if (existingUser) {
		res.status(401).send('User has already exists');
	}

	//Get user name
	const userName = email.split('@')[0];

	//Hash password
	const saltRounds = 10;
	const salt = await bcrypt.genSalt(rounds);
	const hashedPassword = await bcrypt.hash(password, salt);

	//create new user
	const user = {
		email,
		password,
		userName,
		wallets: [],
	};
	User.create(user);

	return { user };
};

module.exports.postLogin = (req, res) => {
	res.json(req.body);
};
