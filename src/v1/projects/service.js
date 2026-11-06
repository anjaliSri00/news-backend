const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");
const { isUUID } = require("../../utils/contentHelper");

const PUBLIC_SELECT = [
  "id",
  "code",
  "title",
  "slug",
  "excerpt",
  "content",
  "read_time",
  "category",
  "tags",
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
  "materials",
  "awards",
  "floor_plans",
  "team_size",
  "budget_range",
  "featured_image_url",
  "gallery",
  "layout_type",
  "published_at",
  "views",
  "extra",
];

/* ══════════════════════════════════════════════════════════
 * Highlights Block (Matches the UI design: 1 Hero + 3 Side)
 * ══════════════════════════════════════════════════════════ */
const getProjectsHighlights = async () => {
  try {
    const baseQuery = () => {
      const q = knex("projects as p")
        .leftJoin("users as u", "u.id", "p.author_id")
        .where({ "p.status": "published", "p.is_active": true })
        .whereNull("p.deleted_at");
      return q;
    };

    // 1. Featured Project (or fallback to latest)
    let featured = await baseQuery()
      .where("p.is_featured", true)
      .orderBy("p.published_at", "desc")
      .select("p.*", "u.name as author_name")
      .first();

    if (!featured) {
      featured = await baseQuery()
        .orderBy("p.published_at", "desc")
        .select("p.*", "u.name as author_name")
        .first();
    }

    // 2. Side Projects (Exclude the featured one)
    const sideQuery = baseQuery()
      .orderBy("p.published_at", "desc")
      .limit(3)
      .select(
        "p.id",
        "p.title",
        "p.slug",
        "p.project_type",
        "p.city",
        "p.featured_image_url",
        "p.published_at",
        "p.read_time",
      );

    if (featured) sideQuery.whereNot("p.id", featured.id);
    const sideProjects = await sideQuery;

    const formatDate = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null;

    return {
      success: true,
      data: {
        header: {
          eyebrow: "BUILT IDEAS, AROUND THE WORLD",
          title: "Projects",
          view_all_text: "View all Projects",
          view_all_link: "/projects",
        },
        featured_project: featured
          ? {
              id: featured.id,
              image_url: featured.featured_image_url,
              category: (featured.project_type || "OTHER").toUpperCase(),
              location: (featured.city || "GLOBAL").toUpperCase(),
              title: featured.title,
              excerpt: featured.excerpt,
              author_name: featured.author_name || "Form & Field",
              published_at_formatted: formatDate(featured.published_at),
              read_time_formatted: `${featured.read_time} min read`,
              slug: `/projects/${featured.slug}`,
            }
          : null,
        latest_projects: sideProjects.map((p) => ({
          id: p.id,
          image_url: p.featured_image_url,
          category: (p.project_type || "OTHER").toUpperCase(),
          location: (p.city || "GLOBAL").toUpperCase(),
          title: p.title,
          published_at_formatted: formatDate(p.published_at),
          read_time_formatted: `${p.read_time} min read`,
          slug: `/projects/${p.slug}`,
        })),
      },
    };
  } catch (error) {
    logger.error("public getProjectsHighlights error", {
      error: error.message,
    });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch highlights.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Standard List & Get
 * ══════════════════════════════════════════════════════════ */
const listProjects = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("projects")
      .where({ status: "published", is_active: true })
      .whereNull("deleted_at");
    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.tag) qb.whereRaw("? = ANY(tags)", [query.tag]);
    if (query.material) qb.whereRaw("? = ANY(materials)", [query.material]);
    if (query.award) qb.whereRaw("? = ANY(awards)", [query.award]);
    if (query.project_type) qb.where({ project_type: query.project_type });
    if (query.city) qb.where({ city: query.city });
    if (query.architect) qb.where("architect", "ilike", `%${query.architect}%`);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) =>
        b.where("title", "ilike", term).orWhere("excerpt", "ilike", term),
      );
    }

    const [rows, countRow] = await Promise.all([
      qb
        .clone()
        .select(PUBLIC_SELECT)
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
    logger.error("public listProjects error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch projects.",
    };
  }
};

const getProjectById = async (id) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const row = await knex("projects")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row)
      return {
        success: false,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getProjectById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch project.",
    };
  }
};

const getProjectBySlug = async (slug) => {
  try {
    const row = await knex("projects")
      .where({ slug, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row)
      return {
        success: false,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getProjectBySlug error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch project.",
    };
  }
};

const incrementViews = async (id) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const updated = await knex("projects")
      .where({ id, status: "published", is_active: true })
      .increment("views", 1);
    if (!updated)
      return {
        success: false,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };
    return {
      success: true,
      data: await knex("projects").where({ id }).select("views").first(),
    };
  } catch (error) {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to increment views.",
    };
  }
};

module.exports = {
  getProjectsHighlights,
  listProjects,
  getProjectById,
  getProjectBySlug,
  incrementViews,
};
