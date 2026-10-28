exports.up = async function up(knex) {
  await knex.schema.createTable("home_decor", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── Code ──────────────────────────────────────────
    table.string("code", 24).notNullable().unique();

    // ── Common content ────────────────────────────────
    table.string("title", 200).notNullable();
    table.string("slug", 220).notNullable().unique();
    table.string("excerpt", 500);
    table.text("content").notNullable();
    table.string("featured_image", 500);

    // ── Inline taxonomy / media ───────────────────────
    table.string("category", 120);
    table.jsonb("tags").notNullable().defaultTo("[]");
    table.jsonb("gallery").notNullable().defaultTo("[]");

    // ── References ────────────────────────────────────
    table
      .uuid("author_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    // ── Publishing ────────────────────────────────────
    table
      .string("status", 20)
      .notNullable()
      .defaultTo("draft")
      .checkIn(["draft", "published", "archived"]);

    table.timestamp("published_at");
    table.integer("views").notNullable().defaultTo(0);
    table.integer("likes").notNullable().defaultTo(0);
    table.jsonb("seo").notNullable().defaultTo("{}");

    // ── Home decor specifics ──────────────────────────
    table.string("room_type", 60); // living, bedroom, kitchen, bathroom, dining, outdoor, office, kids, other
    table.string("style", 100); // modern, classic, scandinavian, industrial, etc.
    table.jsonb("extra").notNullable().defaultTo("{}");
    table.string("article_url", 500);
    // After `status` block
    table
      .string("layout_type", 20)
      .notNullable()
      .defaultTo("medium")
      .checkIn(["featured", "compact", "medium"]);

    table.boolean("is_active").notNullable().defaultTo(true);

    // ── Timestamps ────────────────────────────────────
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at");

    // ── Indexes ───────────────────────────────────────
    table.index(["code"], "home_decor_code_idx");
    table.index(["slug"], "home_decor_slug_idx");
    table.index(["status", "published_at"], "home_decor_status_published_idx");
    table.index(["category"], "home_decor_category_idx");
    table.index(["author_id"], "home_decor_author_idx");
    table.index(["deleted_at"], "home_decor_deleted_idx");
    table.index(["room_type"], "home_decor_room_type_idx");
    table.index(["style"], "home_decor_style_idx");
  });

  // GIN index for JSONB tag filtering
  await knex.raw(`
    CREATE INDEX home_decor_tags_gin_idx ON home_decor USING gin (tags jsonb_path_ops)
  `);
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("home_decor");
};
