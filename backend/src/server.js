const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const errorMiddleware = require('./middleware/errorMiddleware');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');


const app = express();

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Routes will be mounted here as we build them
// app.use('/api/products', require('./routes/productRoutes'));

app.use(errorMiddleware);

const { startAbandonedOrderCleanup } = require('./jobs/cancelAbandonedOrders');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAbandonedOrderCleanup();
});