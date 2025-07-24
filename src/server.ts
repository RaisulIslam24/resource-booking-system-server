import express from 'express';
import cors from 'cors';
import bookings from './routes/booking';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookings);

app.listen(4000, () => console.log('Server on http://localhost:4000'));

