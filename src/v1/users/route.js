const express = require('express'); // Import express
const router = express.Router();
const {

} = require('./controller');
const Auth = require('../../middlewares/auth');

const validationArray = require('../../validations/userValidations');
const validate = require('../../middlewares/validatorError');

// Register route
// router.post('/register');


module.exports = router;
