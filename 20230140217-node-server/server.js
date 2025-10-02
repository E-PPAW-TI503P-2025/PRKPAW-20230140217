var express = require('express')
var cors = require('cors')
var app = express()
var port = 5000

app.use(cors())



app.get('/', (req, res) => {
  res.json({ message: 'Hello from Node.js Server!' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});