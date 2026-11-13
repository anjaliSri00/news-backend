exports.up = async function up(knex) {
  await knex.schema.createTable("showroom_showcases", (table) => {
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

    // ── Showroom Specifics ────────────────────────────
    table.string("brand", 200);
    table.string("address", 300);
    table.string("city", 120);
    table.string("country", 120);

    table.string("contact_phone", 50);
    table.string("contact_email", 255);
    table.string("website_url", 500);

    table.jsonb("opening_hours").notNullable().defaultTo("{}");
    // e.g., { "mon": "9-5", "tue": "9-5", ... }

    table.jsonb("coordinates").notNullable().defaultTo("{}");
    // e.g., { "lat": 40.7128, "lng": -74.0060 }

    // ── Media ─────────────────────────────────────────
    table.string("featured_image_url", 500);
    table.jsonb("gallery").notNullable().defaultTo("[]");

    // ── Presentation & Curation ───────────────────────
    table.string("layout_type", 20).notNullable().defaultTo("card");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.boolean("is_featured").notNullable().defaultTo(false);

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
    table.index(["code"], "showrooms_code_idx");
    table.index(["slug"], "showrooms_slug_idx");
    table.index(["status", "is_active"], "showrooms_status_active_idx");
    table.index(["published_at"], "showrooms_published_idx");
    table.index(["author_id"], "showrooms_author_idx");
    table.index(["deleted_at"], "showrooms_deleted_idx");
    table.index(["brand"], "showrooms_brand_idx");
    table.index(["city"], "showrooms_city_idx");
    table.index(["country"], "showrooms_country_idx");
    table.index(["is_featured", "published_at"], "showrooms_featured_idx");
  });

  // GIN indexes for array queries
  await knex.raw(
    `CREATE INDEX showrooms_category_gin_idx ON showroom_showcases USING gin (category)`,
  );
  await knex.raw(
    `CREATE INDEX showrooms_tags_gin_idx ON showroom_showcases USING gin (tags)`,
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("showroom_showcases");
};
