const Router = require('express');
const router = Router();

const usersRoutes = require('./users/route');
const internalDashboardUsersRoutes = require('./internal-dashboard/users/route');
const eventsRoutes = require("./events/route");              
const internalEventsRoutes = require("./internal-dashboard/events/route"); 

// ─── Public ───────────────────────────────────────────────
router.use('/users', usersRoutes);
router.use('/events', eventsRoutes);

// ─── Internal Dashboard ───────────────────────────────────
router.use('/internal-dashboard/users', internalDashboardUsersRoutes);
router.use('/internal-dashboard/events', internalEventsRoutes);


module.exports = router;
