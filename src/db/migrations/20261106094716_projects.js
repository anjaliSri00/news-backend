exports.up = async function up(knex) {
  await knex.schema.createTable("projects", (table) => {
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

    // ── Project specifics ─────────────────────────────
    table.string("project_type", 50).notNullable().defaultTo("other");
    table.string("project_status", 50).notNullable().defaultTo("completed");

    table.string("location", 300);
    table.string("city", 120);
    table.string("country", 120);

    table.decimal("area", 12, 2);
    table.string("area_unit", 20).defaultTo("sqm");

    table.integer("year");
    table.timestamp("completion_date");

    table.string("architect", 200);
    table.string("client", 200);
    table.string("style", 100);

    table.specificType("materials", "text[]").notNullable().defaultTo("{}");
    table.specificType("awards", "text[]").notNullable().defaultTo("{}");

    table.jsonb("floor_plans").notNullable().defaultTo("[]");
    table.integer("team_size");
    table.string("budget_range", 100);

    // ── Media ─────────────────────────────────────────
    table.string("featured_image_url", 500);
    table.jsonb("gallery").notNullable().defaultTo("[]");

    // ── Presentation & Curation ───────────────────────
    table.string("layout_type", 20).notNullable().defaultTo("card");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.boolean("is_featured").notNullable().defaultTo(false); // Used for the large hero card in your design

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
    table.index(["code"], "projects_code_idx");
    table.index(["slug"], "projects_slug_idx");
    table.index(["status", "is_active"], "projects_status_active_idx");
    table.index(["published_at"], "projects_published_idx");
    table.index(["author_id"], "projects_author_idx");
    table.index(["deleted_at"], "projects_deleted_idx");
    table.index(["layout_type"], "projects_layout_idx");
    table.index(["project_type"], "projects_type_idx");
    table.index(["project_status"], "projects_pstatus_idx");
    table.index(["city"], "projects_city_idx");
    table.index(["country"], "projects_country_idx");
    table.index(["architect"], "projects_architect_idx");
    table.index(["year"], "projects_year_idx");
    table.index(["is_featured", "published_at"], "projects_featured_idx"); // Index for fast hero lookups
  });

  // GIN indexes for array queries
  await knex.raw(
    `CREATE INDEX projects_category_gin_idx ON projects USING gin (category)`,
  );
  await knex.raw(
    `CREATE INDEX projects_tags_gin_idx ON projects USING gin (tags)`,
  );
  await knex.raw(
    `CREATE INDEX projects_materials_gin_idx ON projects USING gin (materials)`,
  );
  await knex.raw(
    `CREATE INDEX projects_awards_gin_idx ON projects USING gin (awards)`,
  );
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("projects");
};
