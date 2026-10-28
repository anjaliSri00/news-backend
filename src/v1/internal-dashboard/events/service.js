/**
 * Dashboard events service — full CRUD, all statuses.
 * Access is enforced by the middleware (requireAccess), not here.
 */
const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateEventCode } = require("../../../utils/codeGenerator");
const {
  isUUID,
  generateUniqueSlug,
  serializeJsonb,
} = require("../../../utils/contentHelper");

/* ══════════════════════════════════════════════════════════
 * List — all statuses, excludes soft-deleted
 * ══════════════════════════════════════════════════════════ */
const listEvents = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("events").whereNull("deleted_at");

    if (query.status) qb.where({ status: query.status });
    if (query.category) qb.where({ category: query.category });
    if (query.event_type) qb.where({ event_type: query.event_type });
    if (query.from_date) qb.where("start_date", ">=", query.from_date);
    if (query.to_date) qb.where("start_date", "<=", query.to_date);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) => {
        b.where("title", "ilike", term)
          .orWhere("excerpt", "ilike", term)
          .orWhere("content", "ilike", term);
      });
    }

    const [rows, countRow] = await Promise.all([
      qb
        .clone()
        .select(
          "id",
          "code",
          "title",
          "slug",
          "excerpt",
          "featured_image",
          "category",
          "tags",
          "status",
          "published_at",
          "event_type",
          "start_date",
          "end_date",
          "venue",
          "city",
          "country",
          "author_id",
          "views",
          "likes",
          "created_at",
          "updated_at",
        )
        .orderBy(sortField, sortDir)
        .offset(skip)
        .limit(limit),
      qb.clone().count("* as count").first(),
    ]);

    const total = parseInt(countRow.count, 10) || 0;

    return {
      success: true,
      data: {
        events: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    logger.error("internal listEvents error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch events.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID — any status, optional include_deleted
 * ══════════════════════════════════════════════════════════ */
const getEventById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid event id.",
      };
    }

    const qb = knex("events").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");

    const event = await qb.first();

    if (!event) {
      return {
        success: false,
        code: "EVENT_NOT_FOUND",
        message: "Event not found.",
      };
    }

    return { success: true, data: event };
  } catch (error) {
    logger.error("internal getEventById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch event.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Create
 * ══════════════════════════════════════════════════════════ */
const createEvent = async (payload, userId) => {
  const MAX_RETRIES = 19;

  try {
    if (!isUUID(userId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid author id.",
      };
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const baseSlug = payload.slug || payload.title;
        const slug = await generateUniqueSlug(knex, baseSlug);
        const code = generateEventCode();

        const isPublished = payload.status === "published";

        const insertData = {
          code,
          slug,
          title: payload.title,
          excerpt: payload.excerpt ?? null,
          content: payload.content,
          featured_image: payload.featured_image ?? null,
          category: payload.category ?? null,
          tags: serializeJsonb(payload.tags, []),
          gallery: serializeJsonb(payload.gallery, []),
          author_id: userId,
          status: payload.status ?? "draft",
          published_at: isPublished ? knex.fn.now() : null,
          seo: serializeJsonb(payload.seo, {}),
          event_type: payload.event_type ?? "other",
          start_date: payload.start_date ?? null,
          end_date: payload.end_date ?? null,
          venue: payload.venue ?? null,
          city: payload.city ?? null,
          country: payload.country ?? null,
          organizer: payload.organizer ?? null,
          registration_url: payload.registration_url ?? null,
          article_url: payload.article_url ?? null,
          extra: serializeJsonb(payload.extra, {}),
        };

        const [row] = await knex("events").insert(insertData).returning("*");
        return { success: true, data: row };
      } catch (err) {
        if (err.code === "23505") {
          const detail = err.detail || "";
          if (
            (detail.includes("code") || detail.includes("slug")) &&
            attempt < MAX_RETRIES - 1
          ) {
            continue;
          }
        }
        throw err;
      }
    }

    return {
      success: false,
      code: "CODE_GEN_FAILED",
      message: "Could not generate unique code/slug. Please try again.",
    };
  } catch (error) {
    logger.error("internal createEvent error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create event.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update
 * ══════════════════════════════════════════════════════════ */
const updateEvent = async (id, payload) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid event id.",
      };
    }

    const existing = await knex("events")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing) {
      return {
        success: false,
        code: "EVENT_NOT_FOUND",
        message: "Event not found.",
      };
    }

    const allowed = [
      "title",
      "excerpt",
      "content",
      "featured_image",
      "category",
      "status",
      "event_type",
      "start_date",
      "end_date",
      "venue",
      "city",
      "country",
      "organizer",
      "registration_url",
      "article_url",
    ];

    const updates = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) updates[key] = payload[key];
    }

    if (payload.tags !== undefined)
      updates.tags = serializeJsonb(payload.tags, []);
    if (payload.gallery !== undefined)
      updates.gallery = serializeJsonb(payload.gallery, []);
    if (payload.seo !== undefined)
      updates.seo = serializeJsonb(payload.seo, {});
    if (payload.extra !== undefined)
      updates.extra = serializeJsonb(payload.extra, {});

    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      updates.slug = await generateUniqueSlug(knex, payload.slug, id);
    }

    if (payload.status === "published" && existing.status !== "published") {
      updates.published_at = existing.published_at || knex.fn.now();
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        code: "NO_CHANGES",
        message: "No valid fields to update.",
      };
    }

    updates.updated_at = knex.fn.now();

    const [row] = await knex("events")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505") {
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "An event with this slug already exists.",
      };
    }
    logger.error("internal updateEvent error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update event.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Soft delete
 * ══════════════════════════════════════════════════════════ */
const deleteEvent = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid event id.",
      };
    }

    const [row] = await knex("events")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "title");

    if (!row) {
      return {
        success: false,
        code: "EVENT_NOT_FOUND",
        message: "Event not found or already deleted.",
      };
    }

    return { success: true, data: row };
  } catch (error) {
    logger.error("internal deleteEvent error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete event.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update status — unified publish / unpublish / archive / restore
 *
 * Body:
 *   { status: "draft" | "published" | "archived", restore?: boolean }
 *
 *   - status: target status (optional if restore=true and preserving status)
 *   - restore: true → also clears deleted_at (un-deletes)
 * ══════════════════════════════════════════════════════════ */
const updateEventStatus = async (id, { status, restore = false }) => {
  try {
    // 1. UUID check
    if (!isUUID(id)) {
      return { success: false, code: "INVALID_INPUT", message: "Invalid event id." };
    }

    // 2. Status check (if provided)
    const ALLOWED = ["draft", "published", "archived"];
    if (status !== undefined && !ALLOWED.includes(status)) {
      return {
        success: false,
        code: "INVALID_STATUS",
        message: `Status must be one of: ${ALLOWED.join(", ")}.`,
      };
    }

    // 3. Find event — include deleted only when restore is requested
    const qb = knex("events").where({ id });
    if (!restore) qb.whereNull("deleted_at");

    const existing = await qb.first();
    if (!existing) {
      return {
        success: false,
        code: "EVENT_NOT_FOUND",
        message: "Event not found.",
      };
    }

    // 4. Resolve target status (fallback to current if not provided with restore)
    const newStatus = status !== undefined ? status : existing.status;

    // 5. Idempotency check — nothing to do?
    const statusUnchanged = existing.status === newStatus;
    const alreadyActive = !restore || existing.deleted_at === null;
    if (statusUnchanged && alreadyActive) {
      return { success: true, data: existing, unchanged: true };
    }

    // 6. Build updates
    const updates = {
      status: newStatus,
      updated_at: knex.fn.now(),
    };

    // Publishing and never published before → set published_at
    if (newStatus === "published" && !existing.published_at) {
      updates.published_at = knex.fn.now();
    }

    // Restore requested → clear soft-delete
    if (restore && existing.deleted_at) {
      updates.deleted_at = null;
    }

    // 7. Apply
    const [row] = await knex("events").where({ id }).update(updates).returning("*");

    return {
      success: true,
      data: row,
      transitions: {
        from_status: existing.status,
        to_status: newStatus,
        was_deleted: existing.deleted_at !== null,
      },
    };
  } catch (error) {
    logger.error("updateEventStatus error", { error: error.message });
    return { success: false, code: "SERVER_ERROR", message: "Failed to update event status." };
  }
};

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
};
