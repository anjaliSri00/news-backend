exports.up = async function up(knex) {
  await knex.schema.createTable("user_type_enums", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name", 60).notNullable().unique();
    table.string("display_name", 100).nullable();
    table.string("description", 500);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["name"], "user_type_enums_name_idx");
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("user_type_enums");
};
