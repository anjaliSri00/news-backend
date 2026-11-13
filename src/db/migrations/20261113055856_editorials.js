exports.up = async function up(knex) {
  await knex.schema.createTable("editorials", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── Identity ──────────────────────────────────────
    table.string("code", 24).notNullable().unique();
    table.string("title", 200).notNullable();
    table.string("slug", 220).notNullable().unique();

    // ── Content ───────────────────────────────────────
    table.string("excerpt", 500);
    table.text("content");
    table.text("opinion"); // The core stance/quote of the editorial
    table.integer("read_time").notNullable().defaultTo(1);

    // ── Taxonomy ──────────────────────────────────────
    table.specificType("category", "text[]").notNullable().defaultTo("{}");
    table.specificType("tags", "text[]").notNullable().defaultTo("{}");

    // ── Editorial Specifics ───────────────────────────
    table.string("editor", 200); // Name of the editor
    table.string("column_name", 150); // e.g. "From the Editor's Desk"
    table.integer("issue_number");

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
    table.index(["code"], "editorials_code_idx");
    table.index(["slug"], "editorials_slug_idx");
    table.index(["status", "is_active"], "editorials_status_active_idx");
    table.index(["published_at"], "editorials_published_idx");
    table.index(["author_id"], "editorials_author_idx");
    table.index(["deleted_at"], "editorials_deleted_idx");
    table.index(["issue_number"], "editorials_issue_idx");
    table.index(["column_name"], "editorials_column_idx");
    table.index(["is_featured", "published_at"], "editorials_featured_idx");
  });

  // GIN indexes for array queries
  await knex.raw(
    `CREATE INDEX editorials_category_gin_idx ON editorials USING gin (category)`,
  );
  await knex.raw(
    `CREATE INDEX editorials_tags_gin_idx ON editorials USING gin (tags)`,
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("editorials");
};
