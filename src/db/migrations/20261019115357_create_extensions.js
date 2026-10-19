/**
 * Migration: Create PostgreSQL extensions
 *
 * Must run BEFORE any table that uses these types:
 *   - pgcrypto  → gen_random_uuid() used as default for all UUID primary keys
 *   - citext    → case-insensitive email column on `users`
 *   - pg_trgm   → trigram indexes for fuzzy search (used later on content tables)
 *
 * Run order is guaranteed by the filename prefix `20240101000000_` which sorts
 * before every other migration.
 */

exports.up = async function up(knex) {
  // UUID generation — required for every `gen_random_uuid()` default
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Case-insensitive text — required for `users.email` as citext
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "citext"');

  // Trigram similarity — required for fuzzy/full-text search indexes
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
};

exports.down = async function down(knex) {
  // Drop in reverse order of dependency.
  // NOTE: we do NOT drop pgcrypto — gen_random_uuid() would break for any
  // remaining tables that still have defaultTo(knex.raw('gen_random_uuid()')).
  await knex.raw('DROP EXTENSION IF EXISTS "pg_trgm"');
  await knex.raw('DROP EXTENSION IF EXISTS "citext"');
};