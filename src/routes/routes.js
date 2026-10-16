const Router = require('express');
const router = Router();

const usersRoutes = require('../v1/indexRoute');
const internalDashboardRoutes = require('../v1/indexRoute');


router.use('/v1', usersRoutes);
router.use('/v1',internalDashboardRoutes);



module.exports = router;
