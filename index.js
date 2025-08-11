const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.post('/join', (req, res) => {
  const { name, email, campus, message } = req.body;

  if (!email.endsWith('@cuny.edu')) {
    return res.send(`<h2>Only CUNY emails are allowed.</h2><a href="/get-involved.html">← Go Back</a>`);
  }

  console.log("New CUNY volunteer:", name, email, campus, message);

  res.send(`<h1>Thank you for joining, ${name} from ${campus}!</h1><a href="/">Back to Home</a>`);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
