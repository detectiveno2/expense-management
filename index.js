require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 5400;

app.get('/', (req, res) => {
  res.send('Hello Ha Tien va Thuy Dung');
});

app.listen(port, () => {
  console.log(`Api server is running on port ${port}`);
});
