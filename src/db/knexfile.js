//knex configurations
const config = require('../config/config'); // Ensure you have your environment variables loaded
const path = require('path');

module.exports = {

  development: {
    client: 'pg',
    connection: {
      host: config.postgres.host,
      port: config.postgres.port,
      user: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.database,
    },
    pool: {
      min: 1,
      max: 2,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.resolve(__dirname, 'migrations'),
      disableMigrationsListValidation: true 
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    },
    debug: true,
  },

  production: {
    client: 'pg',
    connection: {
      host: config.postgres.host,
      port: config.postgres.port,
      user: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.database,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.resolve(__dirname, 'migrations'),
      disableMigrationsListValidation: true 
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    },
    debug: false,
  },
};