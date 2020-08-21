require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Mongoose connect
mongoose.connect(process.env.MONGO_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const app = express();
const port = process.env.PORT || 5400;

// Using middlewares.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Api route.
const apiAuthRoute = require('./api/routes/auth.route');
const apiWalletRoute = require('./api/routes/wallet.route');

// Define route api.
app.use('/api/auth', apiAuthRoute);
app.use('/api/wallet', apiWalletRoute);

app.get('/', (req, res) => {
	res.send('Hello Ha Tien va Thuy Dung');
});

app.listen(port, () => {
	console.log(`Api server is running on port ${port}`);
});
