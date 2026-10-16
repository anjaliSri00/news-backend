const cors = require('cors');

const allowedOrigins = [
  'http://localhost:8008',
  'https://testing.zuhouz.com/',
  'https://zuhouz.com',
  'https://www.zuhouz.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

module.exports = cors(corsOptions);