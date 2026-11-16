const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");

const createLayout = async (payload) => {
  try {
    // 🛡️ Validation: Ensure the IDs provided actually exist in their tables
    const validateSlot = async (type, id, slotName) => {
      if (!type && !id) return true;
      if (!type || !id) throw new Error(`${slotName} missing type or ID`);

      const tableMap = {
        project: "projects",
        trend: "trends",
        designer: "designers",
        design_tech: "design_tech",
        product: "products",
        furniture: "furniture",
        event: "events",
        editorial: "editorials",
      };

      const table = tableMap[type];
      if (!table) throw new Error(`Invalid type '${type}' for ${slotName}`);

      // 🚀 THE ENHANCED CHECK:
      // 1. Does the ID exist?
      // 2. Is it Published?
      // 3. Is it Active?
      // 4. Is it NOT deleted?
      const article = await knex(table)
        .where({
          id: id,
          status: "published",
          is_active: true,
        })
        .whereNull("deleted_at") // Extra safety for soft-deletes
        .first();

      if (!article) {
        throw new Error(
          `Invalid ${type} ID '${id}' for ${slotName}. It may not exist, or it is not published/active.`,
        );
      }
    };

    // Run validation for all slots (this part stays exactly the same)
    await validateSlot(
      payload.hero_left_type,
      payload.hero_left_id,
      "Hero Left",
    );
    await validateSlot(
      payload.middle_top_type,
      payload.middle_top_id,
      "Middle Top",
    );
    await validateSlot(
      payload.middle_bottom_type,
      payload.middle_bottom_id,
      "Middle Bottom",
    );
    await validateSlot(payload.radar_1_type, payload.radar_1_id, "Radar 1");
    await validateSlot(payload.radar_2_type, payload.radar_2_id, "Radar 2");
    await validateSlot(payload.radar_3_type, payload.radar_3_id, "Radar 3");
    await validateSlot(
      payload.editor_note_type,
      payload.editor_note_id,
      "Editor Note",
    );

    // Insert the layout
    const [row] = await knex("home_overview_layouts")
      .insert({
        badge: payload.badge,
        subtitle: payload.subtitle,
        hero_left_type: payload.hero_left_type,
        hero_left_id: payload.hero_left_id,
        middle_top_type: payload.middle_top_type,
        middle_top_id: payload.middle_top_id,
        middle_bottom_type: payload.middle_bottom_type,
        middle_bottom_id: payload.middle_bottom_id,
        radar_1_type: payload.radar_1_type,
        radar_1_id: payload.radar_1_id,
        radar_2_type: payload.radar_2_type,
        radar_2_id: payload.radar_2_id,
        radar_3_type: payload.radar_3_type,
        radar_3_id: payload.radar_3_id,
        editor_note_type: payload.editor_note_type,
        editor_note_id: payload.editor_note_id,
        status: payload.status || "draft",
        published_at: payload.status === "published" ? knex.fn.now() : null,
      })
      .returning("*");

    return { success: true, data: row };
  } catch (error) {
    logger.error("createLayout error", { error: error.message });
    return { success: false, code: "INVALID_DATA", message: error.message };
  }
};

module.exports = { createLayout };
