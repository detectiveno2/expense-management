const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const {
	BAD_REQUEST_STATUS,
	CREATED_STATUS,
} = require('../constants/httpStatus.constant');

module.exports.postRegister = async (req, res) => {
	const { email, password } = req.body;

	//Check if the user exists
	const existingUser = User.findOne({ email });
	if (existingUser) {
		res.status(BAD_REQUEST_STATUS).send('User has already exists');
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
		password: hashedPassword,
		userName,
		wallets: [],
	};
	User.create(user);

	// Generate token
	const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

	return res.status(CREATED_STATUS).json({ token, user });
};

module.exports.postLogin = (req, res) => {
	res.json(req.body);
};
