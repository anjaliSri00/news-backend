exports.up = async function up(knex) {
  await knex.schema.createTable("user_flow_access", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("flow_id")
      .notNullable()
      .references("id")
      .inTable("flows")
      .onDelete("CASCADE");
    table
      .uuid("granted_by")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.timestamp("granted_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("expires_at");
    table.timestamp("revoked_at");

    table.unique(["user_id", "flow_id"], "user_flow_access_unique");
    table.index(["user_id"], "user_flow_access_user_idx");
    table.index(["flow_id"], "user_flow_access_flow_idx");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("user_flow_access");
};
