const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User, validateUser } = require("../database/schema/userSchema");
const debug = require("debug")("app:debug");
const authenticate = require("../middleware/authMid");

/*
this file contains controllers that handle request to /admin path
authenticate middleware is used to only authenticate user can access to this contorlles
and for authorization, role of user in the access token is used
*/

router.get("/", authenticate, (req, res) => {
    return res.status(200).send();
});

router.post("/", authenticate, async (req, res) => {
    debug("===> POST /admin");
    debug(`request body is`);
    debug(req.body);

    if (req.user.role !== "superUser")
        return res.status(403).send("Forbidden. Only superUsers can create country!");

    let request = {
        username: req.body.adminUsername,
        password: req.body.adminPassword,
        role: "admin"
    };

    const { error } = validateUser(request);
    if (error)
        return res.status(400).send(error.details[0].message);

    let findedUser = await User.findOne({ username: request.username });
    if (findedUser)
        return res.status(400).send(`User with username ${request.username} already exists`);

    const salt = await bcrypt.genSalt(10);
    request.password = await bcrypt.hash(request.password, salt);
    let createdUser = await User.create(request);

    let userDto = {
        username: createdUser.username,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt
    }

    return res.status(200).send(userDto);
});

module.exports = router;