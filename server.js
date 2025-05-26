require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the basic Express server! Server is running.');
});

app.use('/api', apiRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Check it out at: http://localhost:${PORT}`);
  console.log(`Check API at: http://localhost:${PORT}/api/message`);
});

require('./scheduler');