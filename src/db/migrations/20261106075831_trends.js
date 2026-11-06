exports.up = async function up(knex) {
  await knex.schema.createTable("trends", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── Identity ──────────────────────────────────────
    table.string("code", 24).notNullable().unique();
    table.string("title", 200).notNullable();
    table.string("slug", 220).notNullable().unique();

    // ── Content ───────────────────────────────────────
    table.string("excerpt", 500);
    table.text("content");
    table.text("forecast");
    table.integer("read_time").notNullable().defaultTo(1);

    // ── Taxonomy ──────────────────────────────────────
    table.specificType("category", "text[]").notNullable().defaultTo("{}");
    table.specificType("tags", "text[]").notNullable().defaultTo("{}");

    // ── Trend specifics ───────────────────────────────
    table
      .string("trend_category", 60)
      .notNullable()
      .defaultTo("general")
      .checkIn([
        "color",
        "material",
        "style",
        "technology",
        "lifestyle",
        "furniture",
        "interior",
        "general",
      ]);

    table
      .string("season", 20)
      .notNullable()
      .defaultTo("all_year")
      .checkIn(["spring", "summer", "autumn", "winter", "all_year"]);

    table.integer("year");

    table
      .string("confidence_level", 20)
      .notNullable()
      .defaultTo("medium")
      .checkIn(["low", "medium", "high"]);

    table
      .string("region", 30)
      .notNullable().defaultTo("global");

    table.specificType("colors", "text[]").notNullable().defaultTo("{}");
    table.specificType("materials", "text[]").notNullable().defaultTo("{}");
    table.specificType("styles", "text[]").notNullable().defaultTo("{}");
    table.specificType("sources", "text[]").notNullable().defaultTo("{}");
    table
      .specificType("related_trend_ids", "text[]")
      .notNullable()
      .defaultTo("{}");

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
    table.index(["code"], "trends_code_idx");
    table.index(["slug"], "trends_slug_idx");
    table.index(["status", "is_active"], "trends_status_active_idx");
    table.index(["published_at"], "trends_published_idx");
    table.index(["author_id"], "trends_author_idx");
    table.index(["deleted_at"], "trends_deleted_idx");
    table.index(["layout_type"], "trends_layout_idx");
    table.index(["trend_category"], "trends_category_idx");
    table.index(["season", "year"], "trends_season_year_idx");
    table.index(["confidence_level"], "trends_confidence_idx");
    table.index(["region"], "trends_region_idx");
  });

  // GIN indexes for array queries
  await knex.raw(
    `CREATE INDEX trends_category_gin_idx ON trends USING gin (category)`,
  );
  await knex.raw(`CREATE INDEX trends_tags_gin_idx ON trends USING gin (tags)`);
  await knex.raw(
    `CREATE INDEX trends_colors_gin_idx ON trends USING gin (colors)`,
  );
  await knex.raw(
    `CREATE INDEX trends_materials_gin_idx ON trends USING gin (materials)`,
  );
  await knex.raw(
    `CREATE INDEX trends_styles_gin_idx ON trends USING gin (styles)`,
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("trends");
};
