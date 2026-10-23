exports.up = async function up(knex) {
  await knex.schema.createTable("pages", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("flow_id")
      .notNullable()
      .references("id")
      .inTable("flows")
      .onDelete("CASCADE");
    table.string("name", 100).notNullable(); // 'list', 'create', 'edit'
    table.string("display_name", 150).notNullable(); // 'Events List', 'Create Event'
    table.string("description", 500);
    table.string("route", 200); // '/events', '/events/create'
    table
      .enu("page_type", ["list", "detail", "create", "edit", "custom"], {
        useNative: true,
        enumName: "page_type",
      })
      .defaultTo("list");
    table.integer("sort_order").notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);

    table.unique(["flow_id", "name"], "pages_flow_name_unique");
    table.index(["flow_id"], "pages_flow_idx");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("pages");
  await knex.raw("DROP TYPE IF EXISTS page_type");
};
