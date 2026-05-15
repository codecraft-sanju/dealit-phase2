require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./database/db');
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const barterRoutes = require('./routes/barterRoutes');

const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const offerRoutes = require('./routes/offerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const aiRoutes = require('./routes/aiRoutes')
const notificationRoutes = require('./routes/notificationRoutes');
require('./workers/notificationWorker');
const { verifyShiprocketConnection } = require('./utils/shiprocket');
const { verifyRazorpayConnection } = require('./controllers/paymentController');

const cron = require('node-cron');
const { autoCancelOverdueOrders } = require('./controllers/orderController');
const { autoCancelOverdueBarters } = require('./controllers/barterController');


const User = require('./models/User');
const Notification = require('./models/Notification');

const app = express();

connectDB();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL, 
    'https://dealiit.com',      
    'https://www.dealiit.com'   
  ], 
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(helmet());

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Backend is running successfully!' 
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: 'UP',
    message: 'Server is healthy and running smoothly!',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/barter', barterRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  verifyRazorpayConnection();
  await verifyShiprocketConnection();

  //Added cron job to run autoCancelOverdueOrders every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running auto-cancel overdue orders cron job...');
    await autoCancelOverdueOrders();
    
  
    console.log('Running auto-cancel overdue barters cron job...');
    await autoCancelOverdueBarters();
    
  });

  //  Daily cron job to sync actual notification counts for all users (Runs at midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily notification count sync job...');
    try {
      const users = await User.find({}, '_id');
      for (const user of users) {
        const actualCount = await Notification.countDocuments({ user: user._id, isRead: false });
        await User.findByIdAndUpdate(user._id, { unreadNotificationsCount: actualCount });
      }
      console.log(`Successfully synced notification counts for ${users.length} users.`);
    } catch (error) {
      console.error('Error running notification count sync job:', error);
    }
  });
});