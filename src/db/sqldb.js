// sqlDb.js
const knex = require('knex');
const knexConfig = require('./knexfile');

console.log('Knex host:', knexConfig.development.connection.host);
console.log('Knex port:', knexConfig.development.connection.port);
console.log('Knex user:', knexConfig.development.connection.user);
console.log('Knex database:', knexConfig.development.connection.database);
const db = knex(knexConfig.development);

// Function to run migrations
const runMigrations = async () => {
  await db.migrate.latest();
};

// Function to run seed files
// const runSeeds = async () => {
//   await db.seed.run();
//   console.log("Seeds ran successfully!");
// };

const sqlDb = {
  db,
  runMigrations,
};

module.exports = sqlDb;
