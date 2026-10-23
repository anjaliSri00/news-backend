const Router = require('express');
const router = Router();

const usersRoutes = require('./users/route');
const internalDashboardUsersRoutes = require('./internal-dashboard/users/route');

// ─── Public ───────────────────────────────────────────────
router.use('/internal-dashboard/users', internalDashboardUsersRoutes);
router.use('/users', usersRoutes);



module.exports = router;
