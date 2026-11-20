const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");

const submitContact = async (payload) => {
  try {
    const [row] = await knex("contact_messages")
      .insert({
        full_name: payload.full_name,
        email: payload.email,
        mobile: payload.mobile ?? null,
        message: payload.message,
        status: "unread",
      })
      .returning("id", "created_at");

    return { success: true, data: row };
  } catch (error) {
    logger.error("submitContact error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to submit message. Please try again.",
    };
  }
};

module.exports = { submitContact };
