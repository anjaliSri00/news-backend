const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");

// Format Date to "14 Oct 2026"
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// 🚀 Helper: Fetches article from its specific table based on the type
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
  showroom: "showroom_showcases",
};

const fetchArticle = async (type, id) => {
  if (!type || !id) return null;

  const tableName = TABLE_MAP[type];
  if (!tableName) return null;

  const row = await knex(tableName)
    .where({ id: id, status: "published", is_active: true })
    .whereNull("deleted_at") // Important for tables that have soft deletes
    .first();

  return row ? { ...row, _type: type } : null;
};
const getHomeOverview = async () => {
  try {
    // 1. Fetch latest published layout
    const layout = await knex("home_overview_layouts")
      .where({ status: "published" })
      .orderBy("published_at", "desc")
      .first();

    if (!layout) {
      return {
        success: false,
        code: "NOT_FOUND",
        message: "No active layout found.",
      };
    }

    // 2. Fetch all connected articles simultaneously
    const [heroLeft, midTop, midBottom, radar1, radar2, radar3, editorNote] =
      await Promise.all([
        fetchArticle(layout.hero_left_type, layout.hero_left_id),
        fetchArticle(layout.middle_top_type, layout.middle_top_id),
        fetchArticle(layout.middle_bottom_type, layout.middle_bottom_id),
        fetchArticle(layout.radar_1_type, layout.radar_1_id),
        fetchArticle(layout.radar_2_type, layout.radar_2_id),
        fetchArticle(layout.radar_3_type, layout.radar_3_id),
        fetchArticle(layout.editor_note_type, layout.editor_note_id),
      ]);

    // 3. Assemble the JSON exactly as the frontend needs it
    return {
      success: true,
      data: {
        header: {
          badge: layout.badge,
          subtitle: layout.subtitle,
        },
        hero_left: heroLeft
          ? {
              type: heroLeft._type,
              category: (
                heroLeft.project_type ||
                heroLeft.category_tag ||
                "FEATURE"
              ).toUpperCase(),
              location: (heroLeft.city || "GLOBAL").toUpperCase(),
              image_url: heroLeft.featured_image_url,
              title: heroLeft.title,
              excerpt: heroLeft.excerpt,
              author: heroLeft.author_name || "Form & Field",
              date: formatDate(heroLeft.published_at),
              read_time: `${heroLeft.read_time} min read`,
              link: `/${heroLeft._type}/${heroLeft.slug}`,
            }
          : null,

        middle_grid: [midTop, midBottom].filter(Boolean).map((item) => ({
          type: item._type,
          category: (item.category_tag || "FEATURE").toUpperCase(),
          image_url: item.featured_image_url,
          title: item.title,
          date: formatDate(item.published_at),
          read_time: `${item.read_time} min read`,
          link: `/${item._type}/${item.slug}`,
        })),

        right_radar: [radar1, radar2, radar3].filter(Boolean).map((item) => ({
          type: item._type,
          category: (item.category_tag || "UPDATE").toUpperCase(),
          title: item.title,
          date: formatDate(item.published_at),
          read_time: `${item.read_time} min read`,
          link: `/${item._type}/${item.slug}`,
        })),

        editor_note: editorNote
          ? {
              quote: editorNote.opinion || editorNote.excerpt,
              author_name: editorNote.editor || "Editor-in-chief",
            }
          : null,
      },
    };
  } catch (error) {
    logger.error("getHomeOverview error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to load overview.",
    };
  }
};

module.exports = { getHomeOverview };
