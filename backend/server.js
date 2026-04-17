const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./models/User');

const ensureDefaultAdmin = async () => {
  try {
    const adminEmail = String(process.env.DEFAULT_ADMIN_EMAIL || '').toLowerCase().trim();
    const adminPassword = String(process.env.DEFAULT_ADMIN_PASSWORD || '');
    const adminName = String(process.env.DEFAULT_ADMIN_NAME || 'System Admin').trim();

    if (!adminEmail || !adminPassword) {
      console.log('Default admin bootstrap skipped. Set DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD in backend/.env');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail }).select('+password');

    if (!existingAdmin) {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      console.log(`Default admin created: ${adminEmail}`);
      return;
    }

    let shouldSave = false;

    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      shouldSave = true;
    }

    if (existingAdmin.name !== adminName) {
      existingAdmin.name = adminName;
      shouldSave = true;
    }

    const matchesPassword = await existingAdmin.comparePassword(adminPassword);
    if (!matchesPassword) {
      existingAdmin.password = adminPassword;
      shouldSave = true;
    }

    if (shouldSave) {
      await existingAdmin.save();
      console.log(`Default admin updated: ${adminEmail}`);
    }
  } catch (error) {
    console.error('Failed to ensure default admin account:', error.message);
  }
};

initializeDatabase();

async function initializeDatabase() {
  try {
    await connectDB();
    await ensureDefaultAdmin();
  } catch (error) {
    console.error('Database bootstrap failed:', error.message);
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/panel', require('./routes/panelRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code !== 'EADDRINUSE') {
    console.error('Server failed to start:', error.message);
    process.exit(1);
  }

  const healthCheckReq = http.get(`http://localhost:${PORT}/api/health`, (res) => {
    if (res.statusCode === 200) {
      console.log(`Backend is already running on port ${PORT}. Skipping duplicate start.`);
      process.exit(0);
      return;
    }

    console.error(`Port ${PORT} is in use by another process. Please free the port or update PORT in backend/.env.`);
    process.exit(1);
  });

  healthCheckReq.on('error', () => {
    console.error(`Port ${PORT} is in use by another process. Please free the port or update PORT in backend/.env.`);
    process.exit(1);
  });
});
