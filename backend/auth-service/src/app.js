const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const spatialRoutes = require('./routes/spatial.routes');
const operationsRoutes = require('./routes/operations.routes');
const stationToolsRoutes = require('./routes/station-tools.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'saarthi-auth-service',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/spatial', spatialRoutes);
app.use('/api/v1/operations', operationsRoutes);
app.use('/api/v1/station-tools', stationToolsRoutes);

// Error Middleware
app.use(errorHandler);

module.exports = app;
