exports.up = async function up(knex) {
  await knex.schema.createTable("news", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── Identity ──────────────────────────────────────
    table.string("code", 24).notNullable().unique();
    table.string("title", 200).notNullable(); // ← added
    table.string("slug", 220).notNullable().unique(); // ← added

    // ── Content ───────────────────────────────────────
    table.string("excerpt", 500);
    table.text("content"); // ← added (nullable)
    table.integer("read_time").notNullable().defaultTo(1);

    // ── Taxonomy ──────────────────────────────────────
    table.specificType("category", "text[]").notNullable().defaultTo("{}");
    table
      .string("news_type", 20)
      .notNullable()
      .defaultTo("latest")
      .checkIn(["trending", "special", "latest"]);

    // ── Media & source ────────────────────────────────
    table.string("featured_image_url", 500);
    table.string("source", 200);
    table.string("source_url", 500);

    // ── References ────────────────────────────────────
    table
      .uuid("author_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    // ── Presentation ──────────────────────────────────
    table.string("layout_type", 20).notNullable().defaultTo("card");
    table.boolean("is_active").notNullable().defaultTo(true);
    table
      .string("status", 20)
      .notNullable()
      .defaultTo("draft")
      .checkIn(["draft", "published", "archived"]);

    // ── Metrics ───────────────────────────────────────
    table.timestamp("published_at"); // ← added
    table.integer("views").notNullable().defaultTo(0); // ← added

    // ── Timestamps ────────────────────────────────────
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at");

    // ── Indexes ───────────────────────────────────────
    table.index(["code"], "news_code_idx");
    table.index(["slug"], "news_slug_idx");
    table.index(["news_type"], "news_type_idx");
    table.index(["status", "is_active"], "news_status_active_idx");
    table.index(["published_at"], "news_published_idx");
    table.index(["author_id"], "news_author_idx");
    table.index(["deleted_at"], "news_deleted_idx");
  });

  // GIN index for category array queries
  await knex.raw(
    `CREATE INDEX news_category_gin_idx ON news USING gin (category)`,
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("news");
};
