import express from 'express';
import bodyParser from 'body-parser';
import homesRouter from './api/homes/homes.route';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/listing-homes', homesRouter);

// Server startup
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
