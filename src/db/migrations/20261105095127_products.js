exports.up = async function up(knex) {
  await knex.schema.createTable("products", (table) => {
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

    // ── Commerce ──────────────────────────────────────
    table.string("brand", 200);
    table.string("sku", 100).unique();
    table.decimal("price", 12, 2);
    table.string("currency", 8).defaultTo("USD");
    table
      .string("availability", 30)
      .notNullable()
      .defaultTo("in_stock")
      .checkIn(["in_stock", "out_of_stock", "preorder", "discontinued"]);

    // ── Product specifics ─────────────────────────────
    table.string("material", 200);
    table.string("color", 100);
    table.string("style", 100);
    table.jsonb("dimensions").notNullable().defaultTo("{}");
    table.jsonb("specifications").notNullable().defaultTo("{}");
    table.jsonb("variants").notNullable().defaultTo("[]");
    table.timestamp("launch_date");
    table.string("warranty", 200);

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
    table.index(["code"], "products_code_idx");
    table.index(["slug"], "products_slug_idx");
    table.index(["sku"], "products_sku_idx");
    table.index(["status", "is_active"], "products_status_active_idx");
    table.index(["published_at"], "products_published_idx");
    table.index(["author_id"], "products_author_idx");
    table.index(["deleted_at"], "products_deleted_idx");
    table.index(["layout_type"], "products_layout_idx");
    table.index(["brand"], "products_brand_idx");
    table.index(["availability"], "products_availability_idx");
    table.index(["price"], "products_price_idx");
    table.index(["style"], "products_style_idx");
    table.index(["launch_date"], "products_launch_idx");
  });

  // GIN indexes for array queries
  await knex.raw(
    `CREATE INDEX products_category_gin_idx ON products USING gin (category)`,
  );
  await knex.raw(
    `CREATE INDEX products_tags_gin_idx ON products USING gin (tags)`,
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("products");
};
