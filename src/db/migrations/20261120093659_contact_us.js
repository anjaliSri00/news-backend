exports.up = async function up(knex) {
  await knex.schema.createTable("contact_messages", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // ── User Input ────────────────────────────────────
    table.string("full_name", 150).notNullable();
    table.string("email", 255).notNullable();
    table.string("mobile", 30);
    table.text("message").notNullable();

    // ── Management ────────────────────────────────────
    table
      .string("status", 20)
      .notNullable()
      .defaultTo("unread")
      .checkIn(["unread", "read", "archived"]); // To toggle read/unread

    // ── Timestamps ────────────────────────────────────
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at");

    // ── Indexes ───────────────────────────────────────
    table.index(["status", "created_at"], "contact_status_idx");
    table.index(["email"], "contact_email_idx");
    table.index(["deleted_at"], "contact_deleted_idx");
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("contact_messages");
};
