const Router = require('express');
const router = Router();

const usersRoutes = require('./users/route');
const internalDashboardUsersRoutes = require('./internal-dashboard/users/route');
const eventsRoutes = require("./events/route");              
const internalEventsRoutes = require("./internal-dashboard/events/route"); 
const homeDecorRoutes = require("./homeDecor/route");
const internalHomeDecorRoutes = require("./internal-dashboard/homeDecor/route");

// ─── Public ───────────────────────────────────────────────
router.use('/users', usersRoutes);
router.use('/events', eventsRoutes);
router.use('/home-decor', homeDecorRoutes);

// ─── Internal Dashboard ───────────────────────────────────
router.use('/internal-dashboard/users', internalDashboardUsersRoutes);
router.use('/internal-dashboard/events', internalEventsRoutes);
router.use('/internal-dashboard/home-decor', internalHomeDecorRoutes);


module.exports = router;
