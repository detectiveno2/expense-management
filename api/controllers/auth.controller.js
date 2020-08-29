const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const {
	BAD_REQUEST_STATUS,
	CREATED_STATUS,
	OK_STATUS,
	NO_CONTENT_STATUS,
} = require('../constants/httpStatus.constant');

module.exports.index = async (req, res) => {
	return res.sendStatus(NO_CONTENT_STATUS);
};

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
	// Get _id from created user to create payload.
	const { _id } = await User.create(user);

	// Generate token
	const payload = { _id, ...user };
	const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);

	// Generate user for local
	const localUser = { email, userName };

	return res.status(CREATED_STATUS).json({ token, localUser });
};

module.exports.postLogin = async (req, res) => {
	const { email, password } = req.body;

	//Check user
	const matchedUser = await User.findOne({ email });
	if (!matchedUser) {
		return res.status(BAD_REQUEST_STATUS).send('Email does not exist.');
	}

	//Check password
	const comparePassword = await bcrypt.compare(password, matchedUser.password);
	if (!comparePassword) {
		return res.status(BAD_REQUEST_STATUS).send('Wrong password.');
	}

	const payload = {
		_id: matchedUser._id,
		email: matchedUser.email,
		password: matchedUser.password,
		userName: matchedUser.userName,
		wallets: matchedUser.wallets,
	};

	// Generate token
	const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);

	// Generate user for local
	const localUser = {
		email: matchedUser.email,
		userName: matchedUser.userName,
	};

	return res.status(OK_STATUS).json({ token, localUser });
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

		// Get _id from createdUser to generate payload
		const { _id } = await User.create(user);

		// Generate token
		const payload = { _id, ...user };
		const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);

		// Generate user for local
		const localUser = { userName };

		return res.status(CREATED_STATUS).json({ token, localUser });
	}

	const payload = {
		_id: matchedUser._id,
		userName: matchedUser.userName,
		socialId: matchedUser.socialId,
		wallets: matchedUser.wallets,
	};

	// Generate token
	const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);

	// Generate user for local
	const localUser = { userName: matchedUser.userName };

	return res.status(OK_STATUS).json({ token, localUser });
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

		// Get _id from createdUser to generate payload
		const { _id } = await User.create(user);

		// Generate token
		const payload = { _id, ...user };
		const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);

		// Generate user for local
		const localUser = { email, userName };

		return res.status(CREATED_STATUS).json({ token, localUser });
	}

	const payload = {
		_id: matchedUser._id,
		email: matchedUser.email,
		userName: matchedUser.userName,
		socialId: matchedUser.socialId,
		wallets: matchedUser.wallets,
	};

	// Generate token
	const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);

	// Generate user for local
	const localUser = {
		email: matchedUser.email,
		userName: matchedUser.userName,
	};

	return res.status(OK_STATUS).json({ token, localUser });
};

module.exports.changePassword = async (req, res) => {
	const { _id, password } = req.user;
	const { currentPassword, newPassword } = req.body;

	// Check current password.
	const result = await bcrypt.compare(currentPassword, password);
	if (!result) {
		return res
			.status(BAD_REQUEST_STATUS)
			.send('current password is incorrect.');
	}

	// Hash new password
	const saltRounds = 10;
	const salt = await bcrypt.genSalt(saltRounds);
	const hashedPassword = await bcrypt.hash(newPassword, salt);

	// Set password
	const user = await User.findOne({ _id });
	await user.updateOne({ $set: { password: hashedPassword } });

	// Generate new token
	const payload = { ...req.user, password: hashedPassword };
	const newToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);

	return res.status(OK_STATUS).json({ newToken });
};
