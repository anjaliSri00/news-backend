# news-backend
# Backend Specification — Form & Field (International Design News)

> **⚠️ Important note about the PDF**
> The uploaded `Form & Field — International design news.pdf` could not be read. Its text layer contains only repeated `1` characters and page numbers (1–153). No actual article titles, section names, or content were extractable.
>
> The specification below is derived from:
> - the `news-backend.txt` folder tree you provided,
> - common patterns for an international design‑news / magazine website,
> - the assumption that the home page is composed of the 14 feature modules listed in your tree.
>
> If you can share the home‑page sections as text, screenshots, or a text‑based PDF, I can refine the models and endpoints to match exactly.

---

## 1. Project Overview

**Project name:** `news-backend`  
**Purpose:** REST API for “Form & Field — International Design News” — a digital magazine covering design, architecture, interiors, products, events, and trends.  
**Architecture:** Modular monolith, versioned API (`/api/v1`), feature‑based folders.  
**Runtime:** Node.js + Express.js  
**Database:** MongoDB (Mongoose) — primary; Redis for caching/sessions; optionally SQL for analytics.  
**Auth:** JWT (access + refresh tokens).  
**File handling:** Multer + cloud storage (S3 / Cloudinary) for images, PDFs, podcasts, videos.  
**PDF generation:** PDFKit / Puppeteer for special reports, editorial PDFs, downloadable issues.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Server | Node.js, Express.js |
| Database | MongoDB (Mongoose), Redis |
| Auth | jsonwebtoken, bcryptjs |
| Validation | Joi / express-validator |
| File upload | Multer, AWS SDK / Cloudinary SDK |
| PDF | PDFKit / Puppeteer |
| Logging | Winston / Morgan |
| Env | dotenv |
| Security | helmet, cors, express-rate-limit, xss-clean, hpp |
| Testing | Jest, Supertest |

---

## 3. Folder Structure (detailed)

news-backend/
├── node_modules/
├── src/
│ ├── common/
│ │ ├── constants.js
│ │ ├── enums.js
│ │ └── roles.js
│ ├── middleware/
│ │ ├── auth.middleware.js # JWT verify, role check
│ │ ├── error.middleware.js # global error handler
│ │ ├── validate.middleware.js # Joi/express-validator runner
│ │ ├── upload.middleware.js # Multer config
│ │ ├── rateLimiter.middleware.js
│ │ └── logger.middleware.js
│ ├── validations/
│ │ ├── auth.validation.js
│ │ ├── events.validation.js
│ │ ├── homeDecor.validation.js
│ │ ├── ... (one per feature)
│ │ └── common.validation.js # pagination, id param
│ ├── utils/
│ │ ├── message-templates/
│ │ │ ├── email.templates.js
│ │ │ └── notification.templates.js
│ │ ├── response-handlers/
│ │ │ ├── success.response.js
│ │ │ └── error.response.js
│ │ ├── validation-result-handlers/
│ │ │ └── validationResult.handler.js
│ │ └── response-messages/
│ │ ├── en.messages.js
│ │ └── index.js
│ ├── config/
│ │ └── config.js # loads env, exports config object
│ ├── db/
│ │ ├── mongo.connection.js
│ │ ├── redis.connection.js
│ │ ├── models/
│ │ │ ├── User.model.js
│ │ │ ├── Event.model.js
│ │ │ ├── HomeDecor.model.js
│ │ │ ├── Furniture.model.js
│ │ │ ├── SpecialReport.model.js
│ │ │ ├── PodcastVideo.model.js
│ │ │ ├── Editorial.model.js
│ │ │ ├── Trend.model.js
│ │ │ ├── Designer.model.js
│ │ │ ├── DesignTech.model.js
│ │ │ ├── Decor.model.js
│ │ │ ├── Showroom.model.js
│ │ │ ├── Project.model.js
│ │ │ ├── Product.model.js
│ │ │ ├── LatestNews.model.js
│ │ │ ├── Category.model.js
│ │ │ ├── Tag.model.js
│ │ │ └── Media.model.js
│ │ └── migrations/ # if SQL is used
│ ├── services/
│ │ ├── pdf.service.js
│ │ ├── email.service.js
│ │ ├── upload.service.js
│ │ └── cache.service.js
│ └── v1/
│ ├── indexRoute.js
│ ├── auth/
│ │ ├── route.js
│ │ ├── controller.js
│ │ └── service.js
│ ├── events/
│ │ ├── route.js
│ │ ├── controller.js
│ │ └── service.js
│ ├── homeDecor/
│ ├── furniture/
│ ├── specialReports/
│ ├── podcastAndVideos/
│ ├── editorialDesk/
│ ├── trends/
│ ├── designer/
│ ├── designTech/
│ ├── decor/
│ ├── showroomShowcase/
│ ├── projects/
│ ├── products/
│ └── latestNews/
├── .env
├── .gitignore
├── package.json
└── server.js


---

## 4. Environment Variables (`.env`)

```env
# App
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# MongoDB
MONGO_URI=mongodb://localhost:27017/form_and_field
MONGO_TEST_URI=mongodb://localhost:27017/form_and_field_test

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@formandfield.com

# Uploads
UPLOAD_PROVIDER=cloudinary   # or s3
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET=

# PDF
PDF_STORAGE_PATH=./public/pdfs

# Rate limit
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100