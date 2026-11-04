exports.up = async function up(knex) {
  await knex.schema.createTable("design_tech", (table) => {
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

    // ── Media ─────────────────────────────────────────
    table.string("featured_image_url", 500);

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

    // ── Extensible payload ────────────────────────────
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
    table.index(["code"], "design_tech_code_idx");
    table.index(["slug"], "design_tech_slug_idx");
    table.index(["status", "is_active"], "design_tech_status_active_idx");
    table.index(["published_at"], "design_tech_published_idx");
    table.index(["author_id"], "design_tech_author_idx");
    table.index(["deleted_at"], "design_tech_deleted_idx");
    table.index(["layout_type"], "design_tech_layout_idx");
  });

  // GIN for category array queries
  await knex.raw(
    `CREATE INDEX design_tech_category_gin_idx ON design_tech USING gin (category)`,
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("design_tech");
};
