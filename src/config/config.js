// config.js

const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define a schema for environment variables
const envSchema = Joi.object({
  PORT: Joi.number().default(8000),
  PG_USER: Joi.string().required(),
  PG_HOST: Joi.string().required(),
  PG_DATABASE: Joi.string().required(),
  PG_PASSWORD: Joi.string().required(),
  PG_PORT: Joi.number().default(5432),
  //MONGODB_URL: Joi.string().required(),
  //RAZORPAY_ID_KEY: Joi.string().required(),
  //RAZORPAY_SECRET_KEY: Joi.string().required(),
//   JWT_SECRET: Joi.string().required(),
//   JWT_ACCESS_SECRET: Joi.string().required(),
//   JWT_REFRESH_SECRET: Joi.string().required(),
  //SENDGRID_API_KEY: Joi.string().required(),
  //TWO_FACTOR_API_KEY: Joi.string().required(),
  // TWO_FACTOR_API_URL: Joi.string().required(),
//   REDIS_HOST: Joi.string().required(),
//   REDIS_PORT: Joi.string().required(),
//   REDIS_PASSWORD: Joi.string().required(),
//   AWS_ACCESS_KEY_ID: Joi.string().required(),
//   AWS_SECRET_ACCESS_KEY: Joi.string().required(),
//   AWS_REGION: Joi.string().default("us-east-1"),
//   AWS_S3_BUCKET: Joi.string().required(),
  //MINIO_ENDPOINT: Joi.string().required(),
  //MINIO_PORT: Joi.number().default(9000),
  //MINIO_USE_SSL: Joi.string().required(),
  //MINIO_BUCKET_NAME: Joi.string().required(),
  //MINIO_ACCESS_KEY: Joi.string().required(),
  //MINIO_SECRET_KEY: Joi.string().required(),
  //MINIO_PUBLIC_BASE_URL: Joi.string().required(),
//   GOOGLE_CLIENT_ID: Joi.string().required(),
//   GOOGLE_CLIENT_SECRET: Joi.string().required(),
//   GOOGLE_REDIRECT_URI: Joi.string().required(),
//   GOOGLE_REFRESH_TOKEN: Joi.string().required(),
  //ADMIN_EMAILS: Joi.string().required(), // Expecting a comma-separated string of emails
  // WHATSAPP_PROVIDER_API_KEY: Joi().string().required(),
  // WHATSAPP_PROVIDER_ENDPOINT: Joi().string().required(),
  // WHATSAPP_SENDER_ID: Joi().string().required(),
})
  .unknown() // Allows environment variables that are not defined in the schema
  .required();

// Validate the environment variables
const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  const missingVars = error.details.map((detail) => detail.message).join(", ");
  throw new Error(
    `Config validation error: Missing required environment variables: ${missingVars}`,
  );
}

// Configuration object
const config = {
  port: {
    port: envVars.PORT,
  },
  postgres: {
    host: envVars.PG_HOST,
    user: envVars.PG_USER,
    password: envVars.PG_PASSWORD,
    database: envVars.PG_DATABASE,
    port: envVars.PG_PORT, // Default port 5432 if not set
  },
  mongo: {
    uri: envVars.MONGODB_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
  },
  razorpay: {
    keyId: envVars.RAZORPAY_ID_KEY,
    keySecret: envVars.RAZORPAY_SECRET_KEY,
  },
  sendgrid: {
    apiKey: envVars.SENDGRID_API_KEY,
  },
  twoFactorAuth: {
    apiKey: envVars.TWO_FACTOR_API_KEY,
    apiUrl: envVars.TWO_FACTOR_API_URL,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
  },
  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
    bucket: envVars.AWS_S3_BUCKET,
  },
  minio: {
    endpoint: envVars.MINIO_ENDPOINT,
    port: envVars.MINIO_PORT,
    useSsl: envVars.MINIO_USE_SSL,
    bucketName: envVars.MINIO_BUCKET_NAME,
    accessKey: envVars.MINIO_ACCESS_KEY,
    secretKey: envVars.MINIO_SECRET_KEY,
    publicBaseUrl: envVars.MINIO_PUBLIC_BASE_URL,
  },
  whatsapp: {
    apiKey: envVars.WHATSAPP_PROVIDER_API_KEY,
    endpoint: envVars.WHATSAPP_PROVIDER_ENDPOINT,
    senderId: envVars.WHATSAPP_SENDER_ID,
  },
  google: {
    clientId: envVars.GOOGLE_CLIENT_ID,
    clientSecret: envVars.GOOGLE_CLIENT_SECRET,
    redirectUri: envVars.GOOGLE_REDIRECT_URI,
    refreshToken: envVars.GOOGLE_REFRESH_TOKEN,
  },
  admin: {
    emails: Array.isArray(envVars.ADMIN_EMAILS)
      ? envVars.ADMIN_EMAILS
      : [envVars.ADMIN_EMAILS],
  },
};

module.exports = config;
