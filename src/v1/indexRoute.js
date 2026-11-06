const Router = require('express');
const router = Router();

const usersRoutes = require('./users/route');
const internalDashboardUsersRoutes = require('./internal-dashboard/users/route');
const eventsRoutes = require("./events/route");              
const internalEventsRoutes = require("./internal-dashboard/events/route"); 
const homeDecorRoutes = require("./homeDecor/route");
const internalHomeDecorRoutes = require("./internal-dashboard/homeDecor/route");
const newsRoutes = require("./news/route");
const internalNewsRoutes = require("./internal-dashboard/news/route");
const internalDesignersRoutes = require("./internal-dashboard/designers/route");
const designersRoutes = require("./designers/route");
const internalDesignTechRoutes = require("./internal-dashboard/designTech/route");
const designTechRoutes = require("./designTech/route");
const furnitureRoutes = require("./furniture/route");
const internalDashboardFurnitureRoutes = require("./internal-dashboard/furniture/route");
const productRoutes = require("./products/routes");
const internalDashboardProductsRoutes = require("./internal-dashboard/products/routes");
const internalDashboardTrendsRoutes = require("./internal-dashboard/trends/route");
const trendsRoutes = require("./trends/route");

// ─── Public ───────────────────────────────────────────────
router.use('/users', usersRoutes);
router.use('/events', eventsRoutes);
router.use('/home-decor', homeDecorRoutes);
router.use('/news', newsRoutes);
router.use('/designers', designersRoutes);
router.use('/design-tech', designTechRoutes);
router.use('/furniture', furnitureRoutes);
router.use('/products', productRoutes);
router.use('/trends', trendsRoutes);

// ─── Internal Dashboard ───────────────────────────────────
router.use('/internal-dashboard/users', internalDashboardUsersRoutes);
router.use('/internal-dashboard/events', internalEventsRoutes);
router.use('/internal-dashboard/home-decor', internalHomeDecorRoutes);
router.use('/internal-dashboard/news', internalNewsRoutes);
router.use('/internal-dashboard/designers', internalDesignersRoutes);
router.use('/internal-dashboard/design-tech', internalDesignTechRoutes);
router.use('/internal-dashboard/furniture', internalDashboardFurnitureRoutes);
router.use('/internal-dashboard/products', internalDashboardProductsRoutes);
router.use('/internal-dashboard/trends', internalDashboardTrendsRoutes);

module.exports = router;
