const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateProjectCode } = require("../../../utils/codeGenerator");
const {
  isUUID,
  generateUniqueSlug,
  serializeJsonb,
  calculateReadTime,
} = require("../../../utils/contentHelper");

const cleanStringArray = (arr, maxLen = 100) => {
  if (!Array.isArray(arr)) return [];
  return [
    ...new Set(
      arr
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0 && v.length <= maxLen),
    ),
  ];
};

const cleanFloorPlans = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((fp) => fp && typeof fp === "object" && typeof fp.url === "string")
    .map((fp) => ({
      url: fp.url,
      ...(fp.title ? { title: String(fp.title).trim() } : {}),
      ...(fp.level ? { level: String(fp.level).trim() } : {}),
    }));
};

const listProjects = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("projects").whereNull("deleted_at");
    if (query.status) qb.where({ status: query.status });
    if (query.is_active !== undefined) qb.where({ is_active: query.is_active });
    if (query.project_type) qb.where({ project_type: query.project_type });
    if (query.city) qb.where({ city: query.city });

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) =>
        b.where("title", "ilike", term).orWhere("architect", "ilike", term),
      );
    }

    const [rows, countRow] = await Promise.all([
      qb
        .clone()
        .select("*")
        .orderBy(sortField, sortDir)
        .offset(skip)
        .limit(limit),
      qb.clone().count("* as count").first(),
    ]);

    return {
      success: true,
      data: {
        projects: rows,
        pagination: {
          page,
          limit,
          total: parseInt(countRow.count, 10),
          totalPages: Math.ceil(parseInt(countRow.count, 10) / limit),
        },
      },
    };
  } catch (error) {
    logger.error("internal listProjects error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch projects.",
    };
  }
};

const getProjectById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const qb = knex("projects").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");
    const row = await qb.first();
    if (!row)
      return {
        success: false,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };
    return { success: true, data: row };
  } catch (error) {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch project.",
    };
  }
};

const createProject = async (payload, userId) => {
  const MAX_RETRIES = 3;
  try {
    if (!isUUID(userId))
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid author id.",
      };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const slug = await generateUniqueSlug(
          knex,
          "projects",
          payload.slug || payload.title,
        );
        const readTime =
          payload.read_time !== undefined
            ? payload.read_time
            : calculateReadTime(payload.content);

        const insertData = {
          code: generateProjectCode(),
          slug,
          title: payload.title,
          excerpt: payload.excerpt ?? null,
          content: payload.content ?? null,
          read_time: readTime,
          category: knex.raw("?::text[]", [
            cleanStringArray(payload.category, 100),
          ]),
          tags: knex.raw("?::text[]", [cleanStringArray(payload.tags, 50)]),
          project_type: payload.project_type ?? "other",
          project_status: payload.project_status ?? "completed",
          location: payload.location ?? null,
          city: payload.city ?? null,
          country: payload.country ?? null,
          area: payload.area ?? null,
          area_unit: payload.area_unit ?? "sqm",
          year: payload.year ?? null,
          completion_date: payload.completion_date ?? null,
          architect: payload.architect ?? null,
          client: payload.client ?? null,
          style: payload.style ?? null,
          materials: knex.raw("?::text[]", [
            cleanStringArray(payload.materials, 100),
          ]),
          awards: knex.raw("?::text[]", [
            cleanStringArray(payload.awards, 200),
          ]),
          floor_plans: serializeJsonb(cleanFloorPlans(payload.floor_plans), []),
          team_size: payload.team_size ?? null,
          budget_range: payload.budget_range ?? null,
          featured_image_url: payload.featured_image_url ?? null,
          gallery: serializeJsonb(payload.gallery, []),
          layout_type: payload.layout_type ?? "card",
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          is_featured:
            payload.is_featured !== undefined ? payload.is_featured : false,
          status: payload.status ?? "draft",
          published_at: payload.status === "published" ? knex.fn.now() : null,
          extra: serializeJsonb(payload.extra, {}),
          author_id: userId,
        };

        const [row] = await knex("projects").insert(insertData).returning("*");
        return { success: true, data: row };
      } catch (err) {
        if (err.code === "23505" && attempt < MAX_RETRIES - 1) continue;
        throw err;
      }
    }
    return {
      success: false,
      code: "CODE_GEN_FAILED",
      message: "Could not generate unique code/slug.",
    };
  } catch (error) {
    logger.error("internal createProject error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create project.",
    };
  }
};

const updateProject = async (id, payload) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const existing = await knex("projects")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing)
      return {
        success: false,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };

    const allowed = [
      "title",
      "excerpt",
      "content",
      "read_time",
      "project_type",
      "project_status",
      "location",
      "city",
      "country",
      "area",
      "area_unit",
      "year",
      "completion_date",
      "architect",
      "client",
      "style",
      "team_size",
      "budget_range",
      "featured_image_url",
      "layout_type",
      "is_active",
      "is_featured",
      "status",
    ];
    const updates = {};
    for (const key of allowed)
      if (payload[key] !== undefined) updates[key] = payload[key];

    if (payload.category !== undefined)
      updates.category = knex.raw("?::text[]", [
        cleanStringArray(payload.category, 100),
      ]);
    if (payload.tags !== undefined)
      updates.tags = knex.raw("?::text[]", [
        cleanStringArray(payload.tags, 50),
      ]);
    if (payload.materials !== undefined)
      updates.materials = knex.raw("?::text[]", [
        cleanStringArray(payload.materials, 100),
      ]);
    if (payload.awards !== undefined)
      updates.awards = knex.raw("?::text[]", [
        cleanStringArray(payload.awards, 200),
      ]);
    if (payload.floor_plans !== undefined)
      updates.floor_plans = serializeJsonb(
        cleanFloorPlans(payload.floor_plans),
        [],
      );
    if (payload.gallery !== undefined)
      updates.gallery = serializeJsonb(payload.gallery, []);
    if (payload.extra !== undefined)
      updates.extra = serializeJsonb(payload.extra, {});

    if (payload.slug !== undefined && payload.slug !== existing.slug)
      updates.slug = await generateUniqueSlug(
        knex,
        "projects",
        payload.slug,
        id,
      );
    if (payload.content !== undefined && payload.read_time === undefined)
      updates.read_time = calculateReadTime(payload.content);
    if (payload.status === "published" && existing.status !== "published")
      updates.published_at = existing.published_at || knex.fn.now();

    if (Object.keys(updates).length === 0)
      return {
        success: false,
        code: "NO_CHANGES",
        message: "No valid fields to update.",
      };
    updates.updated_at = knex.fn.now();

    const [row] = await knex("projects")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505")
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "Slug already exists.",
      };
    logger.error("internal updateProject error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update project.",
    };
  }
};

const deleteProject = async (id) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const [row] = await knex("projects")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "title");
    if (!row)
      return {
        success: false,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found or deleted.",
      };
    return { success: true, data: row };
  } catch (error) {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete project.",
    };
  }
};

const updateProjectStatus = async (id, { status, restore = false }) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const qb = knex("projects").where({ id });
    if (!restore) qb.whereNull("deleted_at");
    const existing = await qb.first();
    if (!existing)
      return {
        success: false,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };

    const newStatus = status !== undefined ? status : existing.status;
    if (
      existing.status === newStatus &&
      (!restore || existing.deleted_at === null)
    )
      return { success: true, data: existing, unchanged: true };

    const updates = { status: newStatus, updated_at: knex.fn.now() };
    if (newStatus === "published" && !existing.published_at)
      updates.published_at = knex.fn.now();
    if (restore && existing.deleted_at) updates.deleted_at = null;

    const [row] = await knex("projects")
      .where({ id })
      .update(updates)
      .returning("*");
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
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update status.",
    };
  }
};

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
};
