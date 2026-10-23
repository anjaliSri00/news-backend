exports.up = async function up(knex) {
  await knex.schema.createTable("internal_users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── Code column MUST come first ──
    table.string("code", 20).notNullable().unique(); // ← THE MISSING LINE

    table
      .uuid("user_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.specificType("user_types", "uuid[]").notNullable().defaultTo("{}");
    table.boolean("is_active").notNullable().defaultTo(true);
    table
      .uuid("invited_by")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.timestamp("invited_at");
    table.timestamp("last_dashboard_login_at");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["code"], "internal_users_code_idx");
    table.index(["user_id"], "internal_users_user_idx");
    table.index(["is_active"], "internal_users_active_idx");
    table.index(knex.raw("user_types"), "internal_users_types_gin_idx", "gin");
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("internal_users");
};
