exports.up = async function up(knex) {
  await knex.schema.createTable("home_overview_layouts", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── Header Text ──
    table.string("badge", 150); // "FEATURED EDITORIAL STORIES / THE WEDNESDAY EDIT"
    table.string("subtitle", 300); // "Architecture. Interiors. A wider perspective."

    // ── HERO LEFT (1 Article) ──
    table.string("hero_left_type", 50); // 'project', 'trend', 'designer', etc.
    table.uuid("hero_left_id");

    // ── MIDDLE COLUMN (2 Articles) ──
    table.string("middle_top_type", 50);
    table.uuid("middle_top_id");

    table.string("middle_bottom_type", 50);
    table.uuid("middle_bottom_id");

    // ── RIGHT RADAR (3 Articles) ──
    table.string("radar_1_type", 50);
    table.uuid("radar_1_id");

    table.string("radar_2_type", 50);
    table.uuid("radar_2_id");

    table.string("radar_3_type", 50);
    table.uuid("radar_3_id");

    // ── BOTTOM RIGHT EDITOR NOTE (1 Article) ──
    table.string("editor_note_type", 50); // Usually 'editorial'
    table.uuid("editor_note_id");

    // ── Publishing ──
    table
      .string("status", 20)
      .notNullable()
      .defaultTo("draft")
      .checkIn(["draft", "published", "archived"]);
    table.timestamp("published_at");

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("home_overview_layouts");
};
