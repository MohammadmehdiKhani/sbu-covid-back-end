const jwt = require("jsonwebtoken");
const config = require("config");

/*
This middleware check if token exist in header 'x-auth-token'
and try to validate it. if token is valid, read username and role
and put then on user property of request and then control is passed
to next middleware
*/

function authenticate(req, res, next) {
    const token = req.header("x-auth-token");

    if (!token)
        return res.status(401).send("Access denied. No token found!");

    try {
        const decoded = jwt.verify(token, config.get("APP_KEY"));
        req.user = decoded;
        next();
    }
    catch (e) {
        res.status(400).send("Invalid token!");
    }
}

module.exports = authenticate;