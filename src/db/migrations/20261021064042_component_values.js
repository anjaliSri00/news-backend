exports.up = async function up(knex) {
  await knex.schema.createTable("component_values", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("component_id")
      .notNullable()
      .references("id")
      .inTable("components")
      .onDelete("CASCADE");
    table.string("name", 100).notNullable(); // 'title_field', 'save_button'
    table.string("display_name", 150).notNullable(); // 'Title', 'Save'
    table.string("description", 500);
    table.string("value_key", 120); // key in the payload
    table
      .enu(
        "value_type",
        [
          "text",
          "number",
          "select",
          "checkbox",
          "button",
          "toggle",
          "date",
          "custom",
        ],
        { useNative: true, enumName: "component_value_type" },
      )
      .defaultTo("custom");
    table
      .enu("action", ["view", "create", "edit", "delete", "export", "custom"], {
        useNative: true,
        enumName: "value_action",
      })
      .defaultTo("view");
    table.integer("sort_order").notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.jsonb("config").defaultTo("{}"); // validation, options, etc.
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.unique(
      ["component_id", "name"],
      "component_values_component_name_unique",
    );
    table.index(["component_id"], "component_values_component_idx");
    table.index(["action"], "component_values_action_idx");
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("component_values");
  await knex.raw("DROP TYPE IF EXISTS component_value_type");
  await knex.raw("DROP TYPE IF EXISTS value_action");
};
