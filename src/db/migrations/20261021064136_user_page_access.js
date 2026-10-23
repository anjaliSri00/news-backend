exports.up = async function up(knex) {
  await knex.schema.createTable("user_page_access", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("page_id")
      .notNullable()
      .references("id")
      .inTable("pages")
      .onDelete("CASCADE");
    table
      .uuid("granted_by")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.timestamp("granted_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("expires_at");
    table.timestamp("revoked_at");

    table.unique(["user_id", "page_id"], "user_page_access_unique");
    table.index(["user_id"], "user_page_access_user_idx");
    table.index(["page_id"], "user_page_access_page_idx");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("user_page_access");
};
