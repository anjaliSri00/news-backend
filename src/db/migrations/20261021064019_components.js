exports.up = async function up(knex) {
  await knex.schema.createTable("components", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("page_id")
      .notNullable()
      .references("id")
      .inTable("pages")
      .onDelete("CASCADE");
    table.string("name", 100).notNullable(); // 'search_bar', 'data_table'
    table.string("display_name", 150).notNullable(); // 'Search Bar', 'Data Table'
    table.string("description", 500);
    table.string("component_key", 120); // frontend key
    table
      .enu(
        "component_type",
        ["form", "table", "search", "action_bar", "header", "chart", "custom"],
        {
          useNative: true,
          enumName: "component_type",
        },
      )
      .defaultTo("custom");
    table.integer("sort_order").notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.unique(["page_id", "name"], "components_page_name_unique");
    table.index(["page_id"], "components_page_idx");
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("components");
  await knex.raw("DROP TYPE IF EXISTS component_type");
};
