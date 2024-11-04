import express from 'express';
import dotenv from 'dotenv';
import urlRoutes from './routes/urlRoutes';

dotenv.config();

const app = express();

app.use(express.json());

app.use('/api', urlRoutes);

export default app;
