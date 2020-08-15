const jwt = require('jsonwebtoken');

const {
	UNAUTHORIZED_STATUS,
	FORBIDDEN_STATUS,
} = require('../constants/httpStatus.constant');

module.exports.checkAuth = async (req, res, next) => {
	const bearerToken = req.headers['authorization'];

	// Check if bearer token is not existed.
	if (!bearerToken) {
		return res.status(UNAUTHORIZED_STATUS).send('User is unauth.');
	}

	// Get jwt token.
	const token = bearerToken.split(' ')[1];

	try {
		// Check if token is wrong.
		const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		req.user = user;
		next();
	} catch (error) {
		// Return forbidden status when token is not valid.
		return res.status(FORBIDDEN_STATUS).send('Forbidden.');
	}
};
