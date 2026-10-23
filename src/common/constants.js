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

module.exports = { EVENT_TYPES, EVENT_CATEGORIES };
