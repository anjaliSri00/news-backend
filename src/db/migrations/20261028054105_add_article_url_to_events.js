exports.up = async function (knex) {
  await knex.schema.alterTable("events", (table) => {
    table.string("article_url", 500).nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("events", (table) => {
    table.dropColumn("article_url");
  });
};