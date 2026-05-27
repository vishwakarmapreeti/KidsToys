import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();
import routes from './routes';
import connectDB from './config/db';


const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', routes);
app.use('/test', (req, res) => res.send('test route'));

connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
  });
});


// The entry point of the entire backend. It creates the Express app, registers middleware (CORS, JSON parser, cookie parser), mounts all routes, then calls connectDB() and starts listening on the port.