exports.up = async function up(knex) {
  await knex.schema.createTable("furniture", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── Identity ──────────────────────────────────────
    table.string("code", 24).notNullable().unique();
    table.string("title", 200).notNullable();
    table.string("slug", 220).notNullable().unique();

    // ── Content ───────────────────────────────────────
    table.string("excerpt", 500);
    table.text("content");
    table.integer("read_time").notNullable().defaultTo(1);

    // ── Taxonomy ──────────────────────────────────────
    table.specificType("category", "text[]").notNullable().defaultTo("{}");
    table.specificType("tags", "text[]").notNullable().defaultTo("{}");

    // ── Furniture specifics ───────────────────────────
    table.string("designer", 200);
    table.string("brand", 200);
    table.string("material", 200);
    table.string("color", 100);
    table.string("style", 100);
    table.jsonb("dimensions").notNullable().defaultTo("{}");
    table.string("price_range", 100);
    table.integer("year");

    // ── Media ─────────────────────────────────────────
    table.string("featured_image_url", 500);
    table.jsonb("gallery").notNullable().defaultTo("[]");

    // ── Presentation ──────────────────────────────────
    table.string("layout_type", 20).notNullable().defaultTo("card");
    table.boolean("is_active").notNullable().defaultTo(true);

    // ── Publishing ────────────────────────────────────
    table
      .string("status", 20)
      .notNullable()
      .defaultTo("draft")
      .checkIn(["draft", "published", "archived"]);

    table.timestamp("published_at");
    table.integer("views").notNullable().defaultTo(0);

    // ── Extensible ────────────────────────────────────
    table.jsonb("extra").notNullable().defaultTo("{}");

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
    table.index(["code"], "furniture_code_idx");
    table.index(["slug"], "furniture_slug_idx");
    table.index(["status", "is_active"], "furniture_status_active_idx");
    table.index(["published_at"], "furniture_published_idx");
    table.index(["author_id"], "furniture_author_idx");
    table.index(["deleted_at"], "furniture_deleted_idx");
    table.index(["layout_type"], "furniture_layout_idx");
    table.index(["designer"], "furniture_designer_idx");
    table.index(["brand"], "furniture_brand_idx");
    table.index(["style"], "furniture_style_idx");
    table.index(["year"], "furniture_year_idx");
  });

  // GIN indexes for array queries
  await knex.raw(
    `CREATE INDEX furniture_category_gin_idx ON furniture USING gin (category)`,
  );
  await knex.raw(
    `CREATE INDEX furniture_tags_gin_idx ON furniture USING gin (tags)`,
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("furniture");
};
