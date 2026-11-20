const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { isUUID } = require("../../../utils/contentHelper");

/* ══════════════════════════════════════════════════════════
 * List all messages
 * ══════════════════════════════════════════════════════════ */
const listContacts = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = knex("contact_messages").whereNull("deleted_at");

    if (query.status) qb.where({ status: query.status });
    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) => {
        b.where("full_name", "ilike", term)
          .orWhere("email", "ilike", term)
          .orWhere("message", "ilike", term);
      });
    }

    const [rows, countRow] = await Promise.all([
      qb
        .clone()
        .select("*")
        .orderBy("created_at", "desc")
        .offset(skip)
        .limit(limit),
      qb.clone().count("* as count").first(),
    ]);

    const total = parseInt(countRow.count, 10) || 0;

    return {
      success: true,
      data: {
        messages: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    logger.error("internal listContacts error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch messages.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update Status (Read/Unread)
 * ══════════════════════════════════════════════════════════ */
const updateStatus = async (id, status) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid message id.",
      };
    }

    const [row] = await knex("contact_messages")
      .where({ id })
      .whereNull("deleted_at")
      .update({ status, updated_at: knex.fn.now() })
      .returning("*");

    if (!row) {
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Message not found.",
      };
    }

    return { success: true, data: row };
  } catch (error) {
    logger.error("internal updateStatus error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update status.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Soft Delete
 * ══════════════════════════════════════════════════════════ */
const deleteContact = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid message id.",
      };
    }

    const [row] = await knex("contact_messages")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now() })
      .returning("id", "full_name", "email");

    if (!row) {
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Message not found or already deleted.",
      };
    }

    return { success: true, data: row };
  } catch (error) {
    logger.error("internal deleteContact error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete message.",
    };
  }
};

module.exports = { listContacts, updateStatus, deleteContact };
