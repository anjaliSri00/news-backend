/**
 * Seeds the full access tree: flows → pages → components → component_values.
 *
 * Every content feature gets 4 pages: list, detail, create, edit.
 * Each page has feature-specific components and values.
 *
 * Safe to re-run — every level upserts by its unique key.
 */

/* ══════════════════════════════════════════════════════════
 * SYSTEM FLOWS — Dashboard, Users, Settings
 * ══════════════════════════════════════════════════════════ */
const SYSTEM_FLOWS = [
  {
    name: "dashboard",
    display_name: "Dashboard",
    section: "system",
    icon: "home",
    route_prefix: "/",
    sort_order: 1,
    pages: [
      {
        name: "overview",
        display_name: "Overview",
        page_type: "custom",
        route: "/",
        components: [
          {
            name: "stats_cards",
            display_name: "Stats Cards",
            component_type: "custom",
            values: [
              {
                name: "total_users",
                display_name: "Total Users",
                value_type: "text",
                action: "view",
              },
              {
                name: "total_content",
                display_name: "Total Content",
                value_type: "text",
                action: "view",
              },
              {
                name: "total_events",
                display_name: "Total Events",
                value_type: "text",
                action: "view",
              },
              {
                name: "total_products",
                display_name: "Total Products",
                value_type: "text",
                action: "view",
              },
              {
                name: "total_projects",
                display_name: "Total Projects",
                value_type: "text",
                action: "view",
              },
              {
                name: "total_views",
                display_name: "Total Views",
                value_type: "text",
                action: "view",
              },
            ],
          },
          {
            name: "recent_activity",
            display_name: "Recent Activity",
            component_type: "table",
            values: [
              {
                name: "recent_content",
                display_name: "Recent Content",
                value_type: "text",
                action: "view",
              },
              {
                name: "recent_users",
                display_name: "Recent Users",
                value_type: "text",
                action: "view",
              },
              {
                name: "recent_logins",
                display_name: "Recent Logins",
                value_type: "text",
                action: "view",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "users",
    display_name: "Users",
    section: "system",
    icon: "users",
    route_prefix: "/users",
    sort_order: 2,
    pages: [
      /* ─── Users List ─────────────────────────────────── */
      {
        name: "list",
        display_name: "Users List",
        page_type: "list",
        route: "/users",
        components: [
          {
            name: "search_bar",
            display_name: "Search Bar",
            component_type: "search",
            values: [
              {
                name: "search_input",
                display_name: "Search by name/email",
                value_type: "text",
                action: "view",
              },
              {
                name: "role_filter",
                display_name: "User Type Filter",
                value_type: "select",
                action: "view",
              },
              {
                name: "status_filter",
                display_name: "Status Filter",
                value_type: "select",
                action: "view",
              },
            ],
          },
          {
            name: "data_table",
            display_name: "Users Table",
            component_type: "table",
            values: [
              {
                name: "view_button",
                display_name: "View",
                value_type: "button",
                action: "view",
              },
              {
                name: "edit_button",
                display_name: "Edit",
                value_type: "button",
                action: "edit",
              },
              {
                name: "delete_button",
                display_name: "Delete",
                value_type: "button",
                action: "delete",
              },
              {
                name: "access_button",
                display_name: "Manage Access",
                value_type: "button",
                action: "edit",
              },
            ],
          },
          {
            name: "action_bar",
            display_name: "Action Bar",
            component_type: "action_bar",
            values: [
              {
                name: "add_internal_button",
                display_name: "Add Internal User",
                value_type: "button",
                action: "create",
              },
              {
                name: "export_button",
                display_name: "Export CSV",
                value_type: "button",
                action: "export",
              },
            ],
          },
          {
            name: "pagination",
            display_name: "Pagination",
            component_type: "custom",
            values: [
              {
                name: "prev_button",
                display_name: "Previous",
                value_type: "button",
                action: "view",
              },
              {
                name: "next_button",
                display_name: "Next",
                value_type: "button",
                action: "view",
              },
            ],
          },
        ],
      },

      /* ─── User Detail ────────────────────────────────── */
      {
        name: "detail",
        display_name: "User Detail",
        page_type: "detail",
        route: "/users/:id",
        components: [
          {
            name: "header",
            display_name: "Header",
            component_type: "header",
            values: [
              {
                name: "user_name",
                display_name: "Name",
                value_type: "text",
                action: "view",
              },
              {
                name: "user_code",
                display_name: "User Code",
                value_type: "text",
                action: "view",
              },
              {
                name: "user_email",
                display_name: "Email",
                value_type: "text",
                action: "view",
              },
              {
                name: "status_badge",
                display_name: "Status",
                value_type: "text",
                action: "view",
              },
              {
                name: "edit_button",
                display_name: "Edit",
                value_type: "button",
                action: "edit",
              },
              {
                name: "delete_button",
                display_name: "Delete",
                value_type: "button",
                action: "delete",
              },
              {
                name: "back_button",
                display_name: "Back to List",
                value_type: "button",
                action: "view",
              },
            ],
          },
          {
            name: "profile_section",
            display_name: "Profile Info",
            component_type: "custom",
            values: [
              {
                name: "avatar",
                display_name: "Avatar",
                value_type: "text",
                action: "view",
              },
              {
                name: "mobile",
                display_name: "Mobile",
                value_type: "text",
                action: "view",
              },
              {
                name: "job_title",
                display_name: "Job Title",
                value_type: "text",
                action: "view",
              },
              {
                name: "bio",
                display_name: "Bio",
                value_type: "text",
                action: "view",
              },
              {
                name: "user_type",
                display_name: "User Type",
                value_type: "text",
                action: "view",
              },
              {
                name: "is_superadmin",
                display_name: "Superadmin",
                value_type: "toggle",
                action: "view",
              },
              {
                name: "email_verified",
                display_name: "Email Verified",
                value_type: "text",
                action: "view",
              },
            ],
          },
          {
            name: "activity_section",
            display_name: "Activity",
            component_type: "custom",
            values: [
              {
                name: "last_login_at",
                display_name: "Last Login",
                value_type: "text",
                action: "view",
              },
              {
                name: "created_at",
                display_name: "Joined At",
                value_type: "text",
                action: "view",
              },
              {
                name: "content_count",
                display_name: "Content Created",
                value_type: "text",
                action: "view",
              },
            ],
          },
          {
            name: "internal_access_section",
            display_name: "Internal Access",
            component_type: "custom",
            values: [
              {
                name: "internal_user_code",
                display_name: "Internal Code",
                value_type: "text",
                action: "view",
              },
              {
                name: "internal_user_types",
                display_name: "Roles",
                value_type: "text",
                action: "view",
              },
              {
                name: "internal_is_active",
                display_name: "Internal Active",
                value_type: "toggle",
                action: "view",
              },
              {
                name: "access_button",
                display_name: "Manage Access",
                value_type: "button",
                action: "edit",
              },
              {
                name: "revoke_button",
                display_name: "Revoke Access",
                value_type: "button",
                action: "delete",
              },
            ],
          },
        ],
      },

      /* ─── Edit User ──────────────────────────────────── */
      {
        name: "edit",
        display_name: "Edit User",
        page_type: "edit",
        route: "/users/:id/edit",
        components: [
          {
            name: "form",
            display_name: "User Form",
            component_type: "form",
            values: [
              {
                name: "name_field",
                display_name: "Name",
                value_type: "text",
                action: "edit",
              },
              {
                name: "email_field",
                display_name: "Email",
                value_type: "text",
                action: "edit",
              },
              {
                name: "mobile_field",
                display_name: "Mobile",
                value_type: "text",
                action: "edit",
              },
              {
                name: "job_title_field",
                display_name: "Job Title",
                value_type: "text",
                action: "edit",
              },
              {
                name: "bio_field",
                display_name: "Bio",
                value_type: "text",
                action: "edit",
              },
              {
                name: "avatar_field",
                display_name: "Avatar",
                value_type: "text",
                action: "edit",
              },
              {
                name: "user_type_field",
                display_name: "User Type",
                value_type: "select",
                action: "edit",
              },
              {
                name: "is_active_toggle",
                display_name: "Active",
                value_type: "toggle",
                action: "edit",
              },
              {
                name: "is_superadmin_toggle",
                display_name: "Superadmin",
                value_type: "toggle",
                action: "edit",
              },
              {
                name: "save_button",
                display_name: "Save Changes",
                value_type: "button",
                action: "edit",
              },
              {
                name: "cancel_button",
                display_name: "Cancel",
                value_type: "button",
                action: "view",
              },
            ],
          },
          {
            name: "password_section",
            display_name: "Reset Password",
            component_type: "form",
            values: [
              {
                name: "new_password_field",
                display_name: "New Password",
                value_type: "text",
                action: "edit",
              },
              {
                name: "reset_button",
                display_name: "Reset Password",
                value_type: "button",
                action: "edit",
              },
            ],
          },
        ],
      },

      /* ─── Add Internal User ──────────────────────────── */
      {
        name: "add",
        display_name: "Add Internal User",
        page_type: "create",
        route: "/users/add",
        components: [
          {
            name: "form",
            display_name: "Add Internal User Form",
            component_type: "form",
            values: [
              {
                name: "user_id_field",
                display_name: "User",
                value_type: "select",
                action: "create",
              },
              {
                name: "user_types_field",
                display_name: "User Types",
                value_type: "select",
                action: "create",
              },
              {
                name: "is_active_toggle",
                display_name: "Active",
                value_type: "toggle",
                action: "create",
              },
              {
                name: "save_button",
                display_name: "Save",
                value_type: "button",
                action: "create",
              },
              {
                name: "cancel_button",
                display_name: "Cancel",
                value_type: "button",
                action: "view",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "settings",
    display_name: "Settings",
    section: "system",
    icon: "settings",
    route_prefix: "/settings",
    sort_order: 99,
    pages: [
      {
        name: "general",
        display_name: "General Settings",
        page_type: "edit",
        route: "/settings",
        components: [
          {
            name: "form",
            display_name: "Site Settings",
            component_type: "form",
            values: [
              {
                name: "site_name_field",
                display_name: "Site Name",
                value_type: "text",
                action: "edit",
              },
              {
                name: "site_tagline_field",
                display_name: "Tagline",
                value_type: "text",
                action: "edit",
              },
              {
                name: "site_logo_field",
                display_name: "Site Logo",
                value_type: "custom",
                action: "edit",
              },
              {
                name: "site_email_field",
                display_name: "Contact Email",
                value_type: "text",
                action: "edit",
              },
              {
                name: "site_phone_field",
                display_name: "Contact Phone",
                value_type: "text",
                action: "edit",
              },
              {
                name: "social_links_field",
                display_name: "Social Links",
                value_type: "custom",
                action: "edit",
              },
              {
                name: "save_button",
                display_name: "Save",
                value_type: "button",
                action: "edit",
              },
            ],
          },
        ],
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════
 * CONTENT FLOWS — 14 feature configs
 * ══════════════════════════════════════════════════════════ */
const CONTENT_FLOW_CONFIGS = [
  {
    name: "events",
    display_name: "Events",
    singular: "Event",
    section: "news",
    icon: "calendar",
    route_prefix: "/events",
    extra_fields: [
      {
        name: "event_type_field",
        display_name: "Event Type",
        value_type: "select",
      },
      {
        name: "start_date_field",
        display_name: "Start Date",
        value_type: "date",
      },
      { name: "end_date_field", display_name: "End Date", value_type: "date" },
      { name: "venue_field", display_name: "Venue", value_type: "text" },
      { name: "city_field", display_name: "City", value_type: "text" },
      { name: "country_field", display_name: "Country", value_type: "text" },
      {
        name: "organizer_field",
        display_name: "Organizer",
        value_type: "text",
      },
      {
        name: "registration_url_field",
        display_name: "Registration URL",
        value_type: "text",
      },
    ],
  },
  {
    name: "home_decor",
    display_name: "Home Decor",
    singular: "Home Decor Item",
    section: "features",
    icon: "home",
    route_prefix: "/home-decor",
    extra_fields: [
      {
        name: "room_type_field",
        display_name: "Room Type",
        value_type: "select",
      },
      { name: "style_field", display_name: "Style", value_type: "select" },
    ],
  },
  {
    name: "furniture",
    display_name: "Furniture",
    singular: "Furniture Item",
    section: "features",
    icon: "armchair",
    route_prefix: "/furniture",
    extra_fields: [
      { name: "designer_field", display_name: "Designer", value_type: "text" },
      { name: "brand_field", display_name: "Brand", value_type: "text" },
      { name: "material_field", display_name: "Material", value_type: "text" },
      { name: "year_field", display_name: "Year", value_type: "number" },
      {
        name: "price_range_field",
        display_name: "Price Range",
        value_type: "text",
      },
    ],
  },
  {
    name: "special_reports",
    display_name: "Special Reports",
    singular: "Special Report",
    section: "reports",
    icon: "file-text",
    route_prefix: "/special-reports",
    extra_fields: [
      {
        name: "report_type_field",
        display_name: "Report Type",
        value_type: "select",
      },
      { name: "pdf_url_field", display_name: "PDF URL", value_type: "text" },
      { name: "pages_field", display_name: "Page Count", value_type: "number" },
      { name: "sponsor_field", display_name: "Sponsor", value_type: "text" },
      {
        name: "downloadable_toggle",
        display_name: "Downloadable",
        value_type: "toggle",
      },
    ],
  },
  {
    name: "podcast_videos",
    display_name: "Podcasts & Videos",
    singular: "Podcast / Video",
    section: "media",
    icon: "video",
    route_prefix: "/podcast-videos",
    extra_fields: [
      {
        name: "media_type_field",
        display_name: "Media Type",
        value_type: "select",
      },
      {
        name: "media_url_field",
        display_name: "Media URL",
        value_type: "text",
      },
      {
        name: "duration_field",
        display_name: "Duration (sec)",
        value_type: "number",
      },
      { name: "host_field", display_name: "Host", value_type: "text" },
      { name: "guest_field", display_name: "Guest", value_type: "text" },
      { name: "season_field", display_name: "Season", value_type: "number" },
      { name: "episode_field", display_name: "Episode", value_type: "number" },
      {
        name: "transcript_field",
        display_name: "Transcript",
        value_type: "text",
      },
    ],
  },
  {
    name: "editorials",
    display_name: "Editorial Desk",
    singular: "Editorial",
    section: "news",
    icon: "edit",
    route_prefix: "/editorials",
    extra_fields: [
      { name: "editor_field", display_name: "Editor", value_type: "text" },
      {
        name: "issue_number_field",
        display_name: "Issue Number",
        value_type: "number",
      },
      { name: "opinion_field", display_name: "Opinion", value_type: "text" },
    ],
  },
  {
    name: "trends",
    display_name: "Trends",
    singular: "Trend",
    section: "features",
    icon: "trending-up",
    route_prefix: "/trends",
    extra_fields: [
      {
        name: "trend_category_field",
        display_name: "Trend Category",
        value_type: "select",
      },
      { name: "season_field", display_name: "Season", value_type: "select" },
      { name: "year_field", display_name: "Year", value_type: "number" },
      { name: "forecast_field", display_name: "Forecast", value_type: "text" },
    ],
  },
  {
    name: "designers",
    display_name: "Designers",
    singular: "Designer",
    section: "directory",
    icon: "user",
    route_prefix: "/designers",
    extra_fields: [
      {
        name: "specialization_field",
        display_name: "Specialization",
        value_type: "text",
      },
      { name: "country_field", display_name: "Country", value_type: "text" },
      {
        name: "portfolio_url_field",
        display_name: "Portfolio URL",
        value_type: "text",
      },
    ],
  },
  {
    name: "design_tech",
    display_name: "Design Tech",
    singular: "Design Tech Item",
    section: "features",
    icon: "cpu",
    route_prefix: "/design-tech",
    extra_fields: [
      {
        name: "technology_field",
        display_name: "Technology",
        value_type: "text",
      },
      {
        name: "application_field",
        display_name: "Application",
        value_type: "text",
      },
      { name: "company_field", display_name: "Company", value_type: "text" },
      {
        name: "product_url_field",
        display_name: "Product URL",
        value_type: "text",
      },
    ],
  },
  {
    name: "decor",
    display_name: "Decor",
    singular: "Decor Item",
    section: "features",
    icon: "layers",
    route_prefix: "/decor",
    extra_fields: [
      {
        name: "decor_type_field",
        display_name: "Decor Type",
        value_type: "select",
      },
    ],
  },
  {
    name: "showrooms",
    display_name: "Showroom Showcase",
    singular: "Showroom",
    section: "directory",
    icon: "map-pin",
    route_prefix: "/showrooms",
    extra_fields: [
      { name: "brand_field", display_name: "Brand", value_type: "text" },
      { name: "address_field", display_name: "Address", value_type: "text" },
      { name: "city_field", display_name: "City", value_type: "text" },
      { name: "country_field", display_name: "Country", value_type: "text" },
      { name: "contact_field", display_name: "Contact", value_type: "text" },
    ],
  },
  {
    name: "projects",
    display_name: "Projects",
    singular: "Project",
    section: "directory",
    icon: "briefcase",
    route_prefix: "/projects",
    extra_fields: [
      {
        name: "project_type_field",
        display_name: "Project Type",
        value_type: "select",
      },
      { name: "location_field", display_name: "Location", value_type: "text" },
      { name: "area_field", display_name: "Area", value_type: "text" },
      { name: "year_field", display_name: "Year", value_type: "number" },
      {
        name: "architect_field",
        display_name: "Architect",
        value_type: "text",
      },
      { name: "client_field", display_name: "Client", value_type: "text" },
      {
        name: "project_status_field",
        display_name: "Project Status",
        value_type: "select",
      },
    ],
  },
  {
    name: "products",
    display_name: "Products",
    singular: "Product",
    section: "directory",
    icon: "package",
    route_prefix: "/products",
    extra_fields: [
      { name: "brand_field", display_name: "Brand", value_type: "text" },
      { name: "price_field", display_name: "Price", value_type: "number" },
      { name: "currency_field", display_name: "Currency", value_type: "text" },
      {
        name: "availability_field",
        display_name: "Availability",
        value_type: "select",
      },
      { name: "sku_field", display_name: "SKU", value_type: "text" },
      {
        name: "launch_date_field",
        display_name: "Launch Date",
        value_type: "date",
      },
    ],
  },
  {
    name: "latest_news",
    display_name: "Latest News",
    singular: "News Item",
    section: "news",
    icon: "zap",
    route_prefix: "/latest-news",
    extra_fields: [
      {
        name: "news_type_field",
        display_name: "News Type",
        value_type: "select",
      },
      { name: "source_field", display_name: "Source", value_type: "text" },
      {
        name: "source_url_field",
        display_name: "Source URL",
        value_type: "text",
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════
 * TEMPLATE BUILDERS — 4 pages per content feature
 * ══════════════════════════════════════════════════════════ */

/** Shared form fields — common to every content feature */
const COMMON_FORM_FIELDS = [
  { name: "title_field", display_name: "Title", value_type: "text" },
  { name: "slug_field", display_name: "Slug", value_type: "text" },
  { name: "excerpt_field", display_name: "Excerpt", value_type: "text" },
  { name: "content_field", display_name: "Content", value_type: "text" },
  { name: "category_field", display_name: "Category", value_type: "select" },
  { name: "status_field", display_name: "Status", value_type: "select" },
  {
    name: "publish_at_field",
    display_name: "Publish Date",
    value_type: "date",
  },
];

function buildFormValues(extraFields, action) {
  return [
    ...COMMON_FORM_FIELDS.map((f) => ({ ...f, action })),
    ...extraFields.map((f) => ({ ...f, action })),
  ];
}

function buildContentFlowPages(config) {
  const { name, display_name, singular, route_prefix, extra_fields } = config;
  const route = route_prefix || `/${name.replace(/_/g, "-")}`;

  return [
    /* ─── LIST PAGE ──────────────────────────────────────── */
    {
      name: "list",
      display_name: `${display_name} List`,
      page_type: "list",
      route,
      components: [
        {
          name: "search_bar",
          display_name: "Search Bar",
          component_type: "search",
          values: [
            {
              name: "search_input",
              display_name: "Search",
              value_type: "text",
              action: "view",
            },
            {
              name: "status_filter",
              display_name: "Status",
              value_type: "select",
              action: "view",
            },
            {
              name: "category_filter",
              display_name: "Category",
              value_type: "select",
              action: "view",
            },
            {
              name: "date_range_from",
              display_name: "From Date",
              value_type: "date",
              action: "view",
            },
            {
              name: "date_range_to",
              display_name: "To Date",
              value_type: "date",
              action: "view",
            },
          ],
        },
        {
          name: "data_table",
          display_name: `${display_name} Table`,
          component_type: "table",
          values: [
            {
              name: "view_button",
              display_name: "View",
              value_type: "button",
              action: "view",
            },
            {
              name: "edit_button",
              display_name: "Edit",
              value_type: "button",
              action: "edit",
            },
            {
              name: "delete_button",
              display_name: "Delete",
              value_type: "button",
              action: "delete",
            },
            {
              name: "publish_button",
              display_name: "Publish/Unpublish",
              value_type: "button",
              action: "edit",
            },
          ],
        },
        {
          name: "action_bar",
          display_name: "Action Bar",
          component_type: "action_bar",
          values: [
            {
              name: "create_button",
              display_name: `Create ${singular}`,
              value_type: "button",
              action: "create",
            },
            {
              name: "export_button",
              display_name: "Export CSV",
              value_type: "button",
              action: "export",
            },
            {
              name: "bulk_delete_button",
              display_name: "Bulk Delete",
              value_type: "button",
              action: "delete",
            },
          ],
        },
        {
          name: "pagination",
          display_name: "Pagination",
          component_type: "custom",
          values: [
            {
              name: "prev_button",
              display_name: "Previous",
              value_type: "button",
              action: "view",
            },
            {
              name: "next_button",
              display_name: "Next",
              value_type: "button",
              action: "view",
            },
            {
              name: "page_size_selector",
              display_name: "Page Size",
              value_type: "select",
              action: "view",
            },
          ],
        },
      ],
    },

    /* ─── DETAIL PAGE ────────────────────────────────────── */
    {
      name: "detail",
      display_name: `${singular} Detail`,
      page_type: "detail",
      route: `${route}/:id`,
      components: [
        {
          name: "header",
          display_name: "Header",
          component_type: "header",
          values: [
            {
              name: "title_display",
              display_name: "Title",
              value_type: "text",
              action: "view",
            },
            {
              name: "code_display",
              display_name: "Code",
              value_type: "text",
              action: "view",
            },
            {
              name: "slug_display",
              display_name: "Slug",
              value_type: "text",
              action: "view",
            },
            {
              name: "status_badge",
              display_name: "Status",
              value_type: "text",
              action: "view",
            },
            {
              name: "edit_button",
              display_name: "Edit",
              value_type: "button",
              action: "edit",
            },
            {
              name: "delete_button",
              display_name: "Delete",
              value_type: "button",
              action: "delete",
            },
            {
              name: "publish_button",
              display_name: "Publish",
              value_type: "button",
              action: "edit",
            },
            {
              name: "back_button",
              display_name: "Back to List",
              value_type: "button",
              action: "view",
            },
          ],
        },
        {
          name: "content_preview",
          display_name: "Content Preview",
          component_type: "custom",
          values: [
            {
              name: "featured_image",
              display_name: "Featured Image",
              value_type: "text",
              action: "view",
            },
            {
              name: "excerpt_display",
              display_name: "Excerpt",
              value_type: "text",
              action: "view",
            },
            {
              name: "content_body",
              display_name: "Content Body",
              value_type: "text",
              action: "view",
            },
          ],
        },
        {
          name: "feature_specific_info",
          display_name: `${singular} Info`,
          component_type: "custom",
          values: extra_fields.map((f) => ({
            name: `${f.name.replace("_field", "")}_display`,
            display_name: f.display_name,
            value_type: "text",
            action: "view",
          })),
        },
        {
          name: "media_gallery",
          display_name: "Media Gallery",
          component_type: "custom",
          values: [
            {
              name: "gallery_images",
              display_name: "Gallery Images",
              value_type: "text",
              action: "view",
            },
            {
              name: "add_media_button",
              display_name: "Add Media",
              value_type: "button",
              action: "edit",
            },
            {
              name: "remove_media_button",
              display_name: "Remove Media",
              value_type: "button",
              action: "edit",
            },
          ],
        },
        {
          name: "tags_section",
          display_name: "Tags",
          component_type: "custom",
          values: [
            {
              name: "tags_display",
              display_name: "Tags",
              value_type: "text",
              action: "view",
            },
            {
              name: "add_tag_button",
              display_name: "Add Tag",
              value_type: "button",
              action: "edit",
            },
            {
              name: "remove_tag_button",
              display_name: "Remove Tag",
              value_type: "button",
              action: "edit",
            },
          ],
        },
        {
          name: "metadata_panel",
          display_name: "Metadata",
          component_type: "custom",
          values: [
            {
              name: "author_display",
              display_name: "Author",
              value_type: "text",
              action: "view",
            },
            {
              name: "created_display",
              display_name: "Created At",
              value_type: "text",
              action: "view",
            },
            {
              name: "updated_display",
              display_name: "Updated At",
              value_type: "text",
              action: "view",
            },
            {
              name: "published_display",
              display_name: "Published At",
              value_type: "text",
              action: "view",
            },
            {
              name: "views_display",
              display_name: "Views",
              value_type: "text",
              action: "view",
            },
            {
              name: "likes_display",
              display_name: "Likes",
              value_type: "text",
              action: "view",
            },
          ],
        },
        {
          name: "seo_panel",
          display_name: "SEO",
          component_type: "custom",
          values: [
            {
              name: "meta_title_display",
              display_name: "Meta Title",
              value_type: "text",
              action: "view",
            },
            {
              name: "meta_description_display",
              display_name: "Meta Description",
              value_type: "text",
              action: "view",
            },
            {
              name: "keywords_display",
              display_name: "Keywords",
              value_type: "text",
              action: "view",
            },
          ],
        },
      ],
    },

    /* ─── CREATE PAGE ────────────────────────────────────── */
    {
      name: "create",
      display_name: `Create ${singular}`,
      page_type: "create",
      route: `${route}/create`,
      components: [
        {
          name: "form",
          display_name: `${singular} Form`,
          component_type: "form",
          values: [
            ...buildFormValues(extra_fields, "create"),
            {
              name: "save_button",
              display_name: "Save as Draft",
              value_type: "button",
              action: "create",
            },
            {
              name: "publish_button",
              display_name: "Publish",
              value_type: "button",
              action: "create",
            },
            {
              name: "cancel_button",
              display_name: "Cancel",
              value_type: "button",
              action: "view",
            },
          ],
        },
        {
          name: "media_uploader",
          display_name: "Media Uploader",
          component_type: "custom",
          values: [
            {
              name: "featured_image_upload",
              display_name: "Upload Featured Image",
              value_type: "custom",
              action: "create",
            },
            {
              name: "gallery_upload",
              display_name: "Upload Gallery",
              value_type: "custom",
              action: "create",
            },
            {
              name: "remove_media_button",
              display_name: "Remove Media",
              value_type: "button",
              action: "create",
            },
          ],
        },
        {
          name: "tags_editor",
          display_name: "Tags Editor",
          component_type: "custom",
          values: [
            {
              name: "tag_input",
              display_name: "Tag",
              value_type: "text",
              action: "create",
            },
            {
              name: "add_tag_button",
              display_name: "Add Tag",
              value_type: "button",
              action: "create",
            },
            {
              name: "remove_tag_button",
              display_name: "Remove Tag",
              value_type: "button",
              action: "create",
            },
          ],
        },
        {
          name: "seo_editor",
          display_name: "SEO Editor",
          component_type: "form",
          values: [
            {
              name: "meta_title_field",
              display_name: "Meta Title",
              value_type: "text",
              action: "create",
            },
            {
              name: "meta_description_field",
              display_name: "Meta Description",
              value_type: "text",
              action: "create",
            },
            {
              name: "keywords_field",
              display_name: "Keywords",
              value_type: "text",
              action: "create",
            },
          ],
        },
      ],
    },

    /* ─── EDIT PAGE ──────────────────────────────────────── */
    {
      name: "edit",
      display_name: `Edit ${singular}`,
      page_type: "edit",
      route: `${route}/:id/edit`,
      components: [
        {
          name: "form",
          display_name: `${singular} Form`,
          component_type: "form",
          values: [
            ...buildFormValues(extra_fields, "edit"),
            {
              name: "save_button",
              display_name: "Save Changes",
              value_type: "button",
              action: "edit",
            },
            {
              name: "publish_button",
              display_name: "Publish/Unpublish",
              value_type: "button",
              action: "edit",
            },
            {
              name: "cancel_button",
              display_name: "Cancel",
              value_type: "button",
              action: "view",
            },
          ],
        },
        {
          name: "media_editor",
          display_name: "Media Editor",
          component_type: "custom",
          values: [
            {
              name: "featured_image_replace",
              display_name: "Replace Featured Image",
              value_type: "custom",
              action: "edit",
            },
            {
              name: "gallery_add",
              display_name: "Add to Gallery",
              value_type: "custom",
              action: "edit",
            },
            {
              name: "gallery_remove",
              display_name: "Remove from Gallery",
              value_type: "button",
              action: "edit",
            },
          ],
        },
        {
          name: "tags_editor",
          display_name: "Tags Editor",
          component_type: "custom",
          values: [
            {
              name: "tag_input",
              display_name: "Tag",
              value_type: "text",
              action: "edit",
            },
            {
              name: "add_tag_button",
              display_name: "Add Tag",
              value_type: "button",
              action: "edit",
            },
            {
              name: "remove_tag_button",
              display_name: "Remove Tag",
              value_type: "button",
              action: "edit",
            },
          ],
        },
        {
          name: "action_bar",
          display_name: "Danger Zone",
          component_type: "action_bar",
          values: [
            {
              name: "archive_button",
              display_name: "Archive",
              value_type: "button",
              action: "edit",
            },
            {
              name: "delete_button",
              display_name: "Delete",
              value_type: "button",
              action: "delete",
            },
          ],
        },
      ],
    },
  ];
}

/* ══════════════════════════════════════════════════════════
 * UPSERT HELPERS
 * ══════════════════════════════════════════════════════════ */
async function upsertFlow(trx, data) {
  const existing = await trx("flows").where({ name: data.name }).first();
  if (existing) return existing;
  const [row] = await trx("flows")
    .insert({
      name: data.name,
      display_name: data.display_name,
      description: data.description || null,
      icon: data.icon || null,
      route_prefix: data.route_prefix || `/${data.name.replace(/_/g, "-")}`,
      section: data.section || "general",
      sort_order: data.sort_order || 0,
      is_active: true,
      config: {},
    })
    .returning("*");
  return row;
}

async function upsertPage(trx, flowId, data) {
  const existing = await trx("pages")
    .where({ flow_id: flowId, name: data.name })
    .first();
  if (existing) return existing;
  const [row] = await trx("pages")
    .insert({
      flow_id: flowId,
      name: data.name,
      display_name: data.display_name,
      description: data.description || null,
      route: data.route || null,
      page_type: data.page_type || "custom",
      sort_order: data.sort_order || 0,
      is_active: true,
    })
    .returning("*");
  return row;
}

async function upsertComponent(trx, pageId, data) {
  const existing = await trx("components")
    .where({ page_id: pageId, name: data.name })
    .first();
  if (existing) return existing;
  const [row] = await trx("components")
    .insert({
      page_id: pageId,
      name: data.name,
      display_name: data.display_name,
      description: data.description || null,
      component_key: data.component_key || null,
      component_type: data.component_type || "custom",
      sort_order: data.sort_order || 0,
      is_active: true,
    })
    .returning("*");
  return row;
}

async function upsertValue(trx, componentId, data) {
  const existing = await trx("component_values")
    .where({ component_id: componentId, name: data.name })
    .first();
  if (existing) return existing;
  const [row] = await trx("component_values")
    .insert({
      component_id: componentId,
      name: data.name,
      display_name: data.display_name,
      description: data.description || null,
      value_key: data.value_key || null,
      value_type: data.value_type || "custom",
      action: data.action || "view",
      sort_order: data.sort_order || 0,
      is_active: true,
      config: data.config || {},
    })
    .returning("*");
  return row;
}

/* ══════════════════════════════════════════════════════════
 * MAIN SEED
 * ══════════════════════════════════════════════════════════ */
exports.seed = async function seed(knex) {
  const stats = { flows: 0, pages: 0, components: 0, values: 0 };
  const log = { flows: [], pagesByFlow: {} };

  await knex.transaction(async (trx) => {
    const allFlows = [
      ...SYSTEM_FLOWS,
      ...CONTENT_FLOW_CONFIGS.map((config) => ({
        name: config.name,
        display_name: config.display_name,
        section: config.section,
        icon: config.icon,
        route_prefix: config.route_prefix,
        sort_order: 10 + CONTENT_FLOW_CONFIGS.indexOf(config),
        pages: buildContentFlowPages(config),
      })),
    ];

    for (const flowData of allFlows) {
      const flow = await upsertFlow(trx, flowData);
      stats.flows++;
      log.flows.push(flow.name);
      log.pagesByFlow[flow.name] = [];

      for (const pageData of flowData.pages || []) {
        const page = await upsertPage(trx, flow.id, pageData);
        stats.pages++;
        log.pagesByFlow[flow.name].push(page.name);

        for (const compData of pageData.components || []) {
          const comp = await upsertComponent(trx, page.id, compData);
          stats.components++;

          for (const valData of compData.values || []) {
            await upsertValue(trx, comp.id, valData);
            stats.values++;
          }
        }
      }
    }
  });

  // ── Summary ──────────────────────────────────────────
  console.log(
    `[seed] access_tree — flows: ${stats.flows}, pages: ${stats.pages}, ` +
      `components: ${stats.components}, values: ${stats.values}`,
  );
  console.log(`[seed]   flows: ${log.flows.join(", ")}`);
  console.log(
    `[seed]   events pages:     ${log.pagesByFlow.events.join(", ")}`,
  );
  console.log(
    `[seed]   products pages:   ${log.pagesByFlow.products.join(", ")}`,
  );
  console.log(`[seed]   users pages:      ${log.pagesByFlow.users.join(", ")}`);
};
