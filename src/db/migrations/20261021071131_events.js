exports.up = async function up(knex) {
  await knex.schema.createTable("events", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── Code column MUST come before any index on code ──
    table.string("code", 24).notNullable().unique(); // ← THE MISSING LINE

    // ── Common content ─────────────────────────────────
    table.string("title", 200).notNullable();
    table.string("slug", 220).notNullable().unique();
    table.string("excerpt", 500);
    table.text("content").notNullable();
    table.string("featured_image", 500);

    // ── Inline category / tags / gallery (single-table design) ──
    table.string("category", 120);
    table.jsonb("tags").notNullable().defaultTo("[]");
    table.jsonb("gallery").notNullable().defaultTo("[]");

    // ── References ─────────────────────────────────────
    table
      .uuid("author_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    // ── Publishing ─────────────────────────────────────
    table
      .string("status", 20)
      .notNullable()
      .defaultTo("draft")
      .checkIn(["draft", "published", "archived"]);

    table.timestamp("published_at");
    table.integer("views").notNullable().defaultTo(0);
    table.integer("likes").notNullable().defaultTo(0);
    table.jsonb("seo").notNullable().defaultTo("{}");

    // ── Event-specific ─────────────────────────────────
    // AFTER — plain string, no constraint
    table
      .string("event_type", 60) // ← widened to 60 for longer values
      .notNullable()
      .defaultTo("other");

    table.timestamp("start_date");
    table.timestamp("end_date");
    table.string("venue", 200);
    table.string("city", 120);
    table.string("country", 120);
    table.string("organizer", 200);
    table.string("registration_url", 500);
    table.jsonb("extra").notNullable().defaultTo("{}");

    // ── Timestamps ─────────────────────────────────────
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at");

    // ── Indexes AFTER all columns ──────────────────────
    table.index(["code"], "events_code_idx");
    table.index(["slug"], "events_slug_idx");
    table.index(["status", "published_at"], "events_status_published_idx");
    table.index(["category"], "events_category_idx");
    table.index(["author_id"], "events_author_idx");
    table.index(["deleted_at"], "events_deleted_idx");
    table.index(["event_type"], "events_type_idx");
    table.index(["start_date"], "events_start_date_idx");
  });

  // GIN index for JSONB tag filtering — must be raw because Knex doesn't support jsonb_path_ops
  await knex.raw(`
    CREATE INDEX events_tags_gin_idx ON events USING gin (tags jsonb_path_ops)
  `);
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("events");
};
