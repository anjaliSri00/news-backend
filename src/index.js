// src/index.js
require('./config/config'); // Load environment variables
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const redisClient = require('./db/redisClient');
// const mongoDBClient = require('./db/mongooseClient');
// const minioClient = require('./db/minioClient');
const bodyParser = require('body-parser');
const router = require('./routes/routes');
const app = express();
const config = require('./config/config');
//const db = require('./db/mongo'); // MongoDB models
const sqlDb = require('./db/sqldb'); // Knex and SQL migrations
const http = require('http'); // Add the http module
//const { s3Client, checkS3Connection } = require('./db/s3Client');


app.use(cors());

async function initializeDatabases () {
  try {
    console.log('Initializing databases...');
    // Run Knex migrations
      await sqlDb.runMigrations();
      console.log("Knex migrations are up to date");

    // Connect to MongoDB
    // mongoDBClient();
    // console.log('MongoDB connected');

    // Connect to Redis
    // await redisClient.connect();
    // console.log('Redis connected');

    // Check MinIO Connection
    // await minioClient.listBuckets((err, buckets) => {
    //   if (err) {
    //     console.error('MinIO Connection Failed:', err);
    //     process.exit(1); // Exit if MinIO connection fails
    //   } else {
    //     console.log('MinIO connected');
    //   }
    // });

    // Check AWS S3 Connection
       //await checkS3Connection();

    // Combine databases into one object
    const databases = {
      //mongo: db,
      sql: sqlDb.db,
      //redis: redisClient,
      //s3: s3Client,
    };

    return databases; // Return the combined databases object
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    process.exit(1); // Exit the process with a failure code
  }
}

async function main () {
  try {
    // Set the configuration in the app
    app.set('config', config);
console.log('Configuration loaded successfully');
    // Initialize databases
    const databases = await initializeDatabases();

    // Attach the combined databases object to the app
    app.set('databases', databases);

    // Start listening after databases are initialized

    // Set up Socket.IO
    // Create HTTP server and integrate with Socket.IO
    const server = http.createServer(app);

    server.listen(config.port.port, () => {
      console.log('Server is running on port:', config.port.port);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1); // Exit the process with a failure code
  }
}

// Call the main function to start the app
main();

// Default root route
app.get('/', (req, res) => {
  res.send('✅ Backend is running successfully!');
});

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    // Check SQL database connection
    await sqlDb.db.raw('SELECT 1');

    // Check MongoDB connection
    // const mongoConnection = db.connection;

    // Check Redis connection using Promise
    try {
    //   const result = await redisClient.ping();
    //   if (result !== 'PONG') {
    //     return res.status(500).json({
    //       status: 'error',
    //       message: 'Redis is down',
    //     });
    //   }
    } catch (redisError) {
      return res.status(500).json({
        status: 'error',
        message: 'Redis is down',
      });
    }

    // All checks passed
    console.log('Health check passed');
    return res.json({
      status: 'ok',
      message: 'All systems operational',
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Health check failed',
    });
  }
});


app.use(cookieParser());
app.use(bodyParser.json());
app.use('/api',router);
