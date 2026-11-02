/**
 * Event type values — validated in the service layer.
 * Add new values here without any migration.
 */
const EVENT_TYPES = [
  "exhibition",
  "fair",
  "webinar",
  "workshop",
  "conference",
  "interior_design",
  "product_launch",
  "award_ceremony",
  "other",
];

/**
 * Event categories — also validated in the service layer.
 * Matches what used to be event_categories.
 */
const EVENT_CATEGORIES = [
  "exhibitions",
  "fairs",
  "conferences",
  "workshops",
  "webinars",
  "interior_design",
  "product_launches",
];

/**
 * Allowed values for news.category[].
 * Mirrors the `name` values of your `flows` table — a news item can be
 * cross-referenced under any content flow.
 *
 * If you rename a flow later, update this list to match.
 */
const NEWS_CATEGORIES = [
  "home_decor",
  "events",
  "trends",
  "furniture",
  "projects",
  "products",
  "designers",
  "design_tech",
  "decor",
  "showroom_showcase",
];



module.exports = { EVENT_TYPES, EVENT_CATEGORIES, NEWS_CATEGORIES };
