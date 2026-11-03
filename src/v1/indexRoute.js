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

// ─── Public ───────────────────────────────────────────────
router.use('/users', usersRoutes);
router.use('/events', eventsRoutes);
router.use('/home-decor', homeDecorRoutes);
router.use('/news', newsRoutes);
router.use('/designers', designersRoutes);

// ─── Internal Dashboard ───────────────────────────────────
router.use('/internal-dashboard/users', internalDashboardUsersRoutes);
router.use('/internal-dashboard/events', internalEventsRoutes);
router.use('/internal-dashboard/home-decor', internalHomeDecorRoutes);
router.use('/internal-dashboard/news', internalNewsRoutes);
router.use('/internal-dashboard/designers', internalDesignersRoutes);

module.exports = router;
