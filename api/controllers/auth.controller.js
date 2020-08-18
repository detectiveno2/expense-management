const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/user.model');
const {
	BAD_REQUEST_STATUS,
	CREATED_STATUS,
	OK_STATUS,
} = require('../constants/httpStatus.constant');

module.exports.postRegister = async (req, res) => {
	const { email, password } = req.body;

	//Check if the user exists
	const existingUser = await User.findOne({ email });
	if (existingUser) {
		return res.status(BAD_REQUEST_STATUS).send('User has already exists');
	}

	//Get user name
	const userName = email.split('@')[0];

	//Hash password
	const saltRounds = 10;
	const salt = await bcrypt.genSalt(saltRounds);
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

module.exports.postLogin = async (req, res) => {
	const { email, password } = req.body;

	//Check user
	const matchedUser = await User.findOne({ email });
	if (!matchedUser) {
		return res.status(BAD_REQUEST_STATUS).send('Email does not exist.');
	}

	//Check password
	const comparePassword = bcrypt.compare(password, matchedUser.password);
	if (!comparePassword) {
		return res.status(BAD_REQUEST_STATUS).send('Wrong password.');
	}

	const user = {
		email: matchedUser.email,
		password: matchedUser.password,
		userName: matchedUser.userName,
		wallets: matchedUser.wallets,
	};

	// Generate token
	const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

	return res.status(OK_STATUS).json({ token, user });
};

module.exports.facebook = async (req, res) => {
	const { userName, userId } = req.body;

	//Check user
	const matchedUser = await User.findOne({ socialId: userId });
	if (!matchedUser) {
		//create new user
		const user = {
			userName,
			socialId: userId,
			wallets: [],
		};
		User.create(user);

		// Generate token
		const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

		return res.status(CREATED_STATUS).json({ token, user });
	}

	const user = {
		userName: matchedUser.userName,
		socialId: matchedUser.socialId,
		wallets: matchedUser.wallets,
	};

	// Generate token
	const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

	return res.status(OK_STATUS).json({ token, user });
};

module.exports.google = async (req, res) => {
	const { userName, userId, email } = req.body;

	//Check user
	const matchedUser = await User.findOne({ socialId: userId });
	if (!matchedUser) {
		//create new user
		const user = {
			email,
			userName,
			socialId: userId,
			wallets: [],
		};
		User.create(user);

		// Generate token
		const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

		return res.status(CREATED_STATUS).json({ token, user });
	}

	const user = {
		email: matchedUser.email,
		userName: matchedUser.userName,
		socialId: matchedUser.socialId,
		wallets: matchedUser.wallets,
	};

	// Generate token
	const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

	return res.status(OK_STATUS).json({ token, user });
};
