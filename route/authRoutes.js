const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const { User, validateUser } = require("../database/schema/userSchema");
const config = require("config");
const debug = require("debug")("app:debug");

router.get("/", (req, res) => {
    return res.status(200).send();
});

router.post("/", async (req, res, next) => {
    debug(`===> POST /auth`);
    debug(`request body is`);
    debug(req.body);

    let request = {
        username: req.body.username,
        password: req.body.password,
    };

    const { error } = validateUserInAuthentication(request);
    if (error)
        return res.status(400).send(error.details[0].message);

    let findedUser = await User.findOne({ username: request.username });
    if (!findedUser)
        return res.status(400).send(`User with username ${request.username} does not exists`);

    const isPasswordValid = await bcrypt.compare(request.password, findedUser.password);
    if (!isPasswordValid)
        return res.status(400).send(`Password is invalid`);

    const userDto = {
        username: findedUser.username,
        role: findedUser.role
    }
    const token = jwt.sign(userDto, config.get("APP_KEY"));
    return res.status(200).header("x-auth-token", token).send("Access token created successfully");
});

function validateUserInAuthentication(user) {
    const schema = Joi.object({
        username: Joi.required(),
        password: Joi.required()
    });

    return schema.validate(user);
}

module.exports = router;