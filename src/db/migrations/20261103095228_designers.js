exports.up = async function up(knex) {
  await knex.schema.createTable("designers", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── Identity ──────────────────────────────────────
    table.string("code", 24).notNullable().unique();
    table.string("name", 200).notNullable();
    table.string("slug", 220).notNullable().unique();
    table.string("email", 255); // ← ADDED (nullable, not unique)

    // ── Bio ───────────────────────────────────────────
    table.string("excerpt", 500);
    table.text("bio");
    table.integer("read_time").notNullable().defaultTo(1);

    // ── Location ──────────────────────────────────────
    table.string("city", 120);
    table.string("country", 120);

    // ── Professional ──────────────────────────────────
    table.string("specialization", 200);
    table.string("portfolio_url", 500);

    // ── Media ─────────────────────────────────────────
    table.string("featured_image_url", 500);
    table.string("avatar_url", 500);
    table.jsonb("gallery").notNullable().defaultTo("[]");

    // ── Awards ────────────────────────────────────────
    table.specificType("awards", "text[]").notNullable().defaultTo("{}");

    // ── Publishing ────────────────────────────────────
    table
      .string("status", 20)
      .notNullable()
      .defaultTo("draft")
      .checkIn(["draft", "published", "archived"]);

    table.boolean("is_active").notNullable().defaultTo(true);
    table.string("layout_type", 20).notNullable().defaultTo("card");
    table.timestamp("published_at");

    // ── References ────────────────────────────────────
    table
      .uuid("author_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    // ── Timestamps ────────────────────────────────────
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at");

    // ── Indexes ───────────────────────────────────────
    table.index(["code"], "designers_code_idx");
    table.index(["slug"], "designers_slug_idx");
    table.index(["status", "is_active"], "designers_status_active_idx");
    table.index(["published_at"], "designers_published_idx");
    table.index(["city"], "designers_city_idx");
    table.index(["country"], "designers_country_idx");
    table.index(["specialization"], "designers_specialization_idx");
    table.index(["author_id"], "designers_author_idx");
    table.index(["deleted_at"], "designers_deleted_idx");

    // Optional — index on email for admin search
    table.index(["email"], "designers_email_idx"); // ← ADDED (non-unique)
  });

  // GIN index for awards array queries
  await knex.raw(
    `CREATE INDEX designers_awards_gin_idx ON designers USING gin (awards)`,
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("designers");
};
