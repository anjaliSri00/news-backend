exports.up = async function up(knex) {
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name", 120).notNullable();
    table.specificType("email", "citext").notNullable().unique();
    table.string("password_hash", 255).notNullable();

    // Access model
    table
      .uuid("user_type")
      .references("id")
      .inTable("user_type_enums")
      .onDelete("SET NULL");
    table.boolean("is_superadmin").notNullable().defaultTo(false);

    // Profile
    table.string("avatar", 500);
    table.string("job_title", 120);
    table.string("bio", 500);

    // Account state
    table.boolean("is_active").notNullable().defaultTo(true);
    table.boolean("is_email_verified").notNullable().defaultTo(false);
    table.timestamp("email_verified_at");
    table.timestamp("last_login_at"); // ✅ KEEP

    // Audit
    table
      .uuid("created_by")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at");

    table.index(["user_type"], "users_type_idx");
    table.index(["is_superadmin"], "users_superadmin_idx");
    table.index(["is_active"], "users_active_idx");
    table.index(["deleted_at"], "users_deleted_idx");
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('users');
};
