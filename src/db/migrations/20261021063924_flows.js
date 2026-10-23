exports.up = async function up(knex) {
  await knex.schema.createTable("flows", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name", 100).notNullable().unique(); // 'events', 'products'
    table.string("display_name", 150).notNullable(); // 'Events', 'Products'
    table.string("description", 500);
    table.string("icon", 60);
    table.string("route_prefix", 100); // '/events', '/products'
    table.string("section", 60); // 'news', 'directory'
    table.integer("sort_order").notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.jsonb("config").defaultTo("{}");

    table.index(["name"], "flows_name_idx");
    table.index(["section"], "flows_section_idx");
    table.index(["is_active"], "flows_active_idx");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("flows");
};
