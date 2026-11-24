const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");

// Shared validation helper
// 🚀 CENTRAL MAP OF TYPES TO TABLES
const TABLE_MAP = {
  project: "projects",
  trend: "trends",
  designer: "designers",
  design_tech: "design_tech",
  product: "products",
  furniture: "furniture",
  event: "events",
  editorial: "editorials",
  home_decor: "home_decor",
  news: "news",
  showroom: "showroom_showcases", // mapped to your actual table name
};

// Shared validation helper
const validateLayoutSlots = async (payload) => {
  const slots = [
    {
      type: payload.hero_left_type,
      id: payload.hero_left_id,
      name: "Hero Left",
    },
    {
      type: payload.middle_top_type,
      id: payload.middle_top_id,
      name: "Middle Top",
    },
    {
      type: payload.middle_bottom_type,
      id: payload.middle_bottom_id,
      name: "Middle Bottom",
    },
    { type: payload.radar_1_type, id: payload.radar_1_id, name: "Radar 1" },
    { type: payload.radar_2_type, id: payload.radar_2_id, name: "Radar 2" },
    { type: payload.radar_3_type, id: payload.radar_3_id, name: "Radar 3" },
    {
      type: payload.editor_note_type,
      id: payload.editor_note_id,
      name: "Editor Note",
    },
  ];

  for (const slot of slots) {
    if (!slot.type && !slot.id) continue;
    if (!slot.type || !slot.id)
      throw new Error(`${slot.name} missing type or ID.`);

    const table = TABLE_MAP[slot.type];
    if (!table)
      throw new Error(`Invalid type '${slot.type}' for ${slot.name}.`);

    const exists = await knex(table)
      .where({ id: slot.id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!exists)
      throw new Error(
        `Invalid ${slot.type} ID '${slot.id}' for ${slot.name}. Must be published and active.`,
      );
  }
};

/* ══════════════════════════════════════════════════════════
 * GET AVAILABLE CONTENT FOR A SPECIFIC SLOT TYPE
 * ══════════════════════════════════════════════════════════ */
const getAvailableContent = async (type, query) => {
  try {
    const tableName = TABLE_MAP[type];
    if (!tableName) {
      return {
        success: false,
        code: "INVALID_DATA",
        message: "Invalid content type.",
      };
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const qb = knex(tableName)
      .where({ status: "published" })

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) =>
        b.where("name", "ilike", term),
      );
    }

    const [rows, countRow] = await Promise.all([
      qb
        .clone()
        .select("*")
        .orderBy("published_at", "desc")
        .offset(skip)
        .limit(limit),
      qb.clone().count("* as count").first(),
    ]);

    const total = parseInt(countRow.count, 10) || 0;

    return {
      success: true,
      data: {
        type,
        items: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    logger.error("getAvailableContent error", { error: error.message, type });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch available content.",
    };
  }
};

const listLayouts = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const qb = knex("home_overview_layouts");
    if (query.status) qb.where({ status: query.status });

    const [rows, countRow] = await Promise.all([
      qb
        .clone()
        .select("*")
        .orderBy("created_at", "desc")
        .offset(skip)
        .limit(limit),
      qb.clone().count("* as count").first(),
    ]);

    return {
      success: true,
      data: {
        layouts: rows,
        pagination: { page, limit, total: parseInt(countRow.count, 10) },
      },
    };
  } catch (error) {
    logger.error("internal listLayouts error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to list layouts.",
    };
  }
};

const getLayoutById = async (id) => {
  try {
    const row = await knex("home_overview_layouts")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!row)
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Layout not found.",
      };
    return { success: true, data: row };
  } catch (error) {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch layout.",
    };
  }
};

const createLayout = async (payload) => {
  try {
    await validateLayoutSlots(payload); // 🛡️ Run validation

    const [row] = await knex("home_overview_layouts")
      .insert({
        ...payload,
        status: payload.status || "draft",
        published_at: payload.status === "published" ? knex.fn.now() : null,
      })
      .returning("*");

    return { success: true, data: row };
  } catch (error) {
    logger.error("internal createLayout error", { error: error.message });
    return { success: false, code: "INVALID_DATA", message: error.message };
  }
};

const updateLayout = async (id, payload) => {
  try {
    const existing = await knex("home_overview_layouts")
      .where({ id })
      .first();
    if (!existing)
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Layout not found.",
      };

    await validateLayoutSlots(payload); // 🛡️ Run validation

    const updates = { ...payload, updated_at: knex.fn.now() };
    if (payload.status === "published" && existing.status !== "published") {
      updates.published_at = existing.published_at || knex.fn.now();
    }

    const [row] = await knex("home_overview_layouts")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal updateLayout error", { error: error.message });
    return { success: false, code: "INVALID_DATA", message: error.message };
  }
};

const deleteLayout = async (id) => {
  try {
    const [row] = await knex("home_overview_layouts")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now() })
      .returning("id");
    if (!row)
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Layout not found.",
      };
    return { success: true, data: row };
  } catch (error) {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete layout.",
    };
  }
};

const updateLayoutStatus = async (id, { status, restore }) => {
  try {
    const qb = knex("home_overview_layouts").where({ id });
    // if (!restore) qb.whereNull("deleted_at");
    const existing = await qb.first();
    if (!existing)
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Layout not found.",
      };

    const updates = {};
    if (status) {
      updates.status = status;
      if (status === "published" && !existing.published_at)
        updates.published_at = knex.fn.now();
    }
    if (restore) updates.deleted_at = null;

    const [row] = await knex("home_overview_layouts")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update status.",
    };
  }
};

module.exports = {
  listLayouts,
  getLayoutById,
  createLayout,
  updateLayout,
  deleteLayout,
  updateLayoutStatus,
  getAvailableContent,
};
