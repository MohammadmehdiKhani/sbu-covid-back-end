const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { Country, validateCountry } = require("../database/schema/countrySchema");
const { User, validateUser } = require("../database/schema/userSchema");
const debug = require("debug")("app:debug");
const authenticate = require("../middleware/authMid");
const mongoose = require("mongoose");

/*
this file contains controllers that handle request to /countries path
authenticate middleware is used to only authenticate user can access to this contorlles
and for authorization, role of user in the access token is used
*/

router.get("/", async (req, res) => {
    let sort = req.query.sort;
    let sortFilter = { "todayCases": 1 };
    if (sort == "todayDeaths")
        sortFilter = { "todayDeaths": 1 };
    if (sort == "todayRecovered")
        sortFilter = { "todayRecovered": 1 };

    let countries = await Country.find({}).sort(sortFilter);
    return res.status(200).send(countries);
});

router.get("/:countryName", async (req, res) => {
    let countryName = req.params.countryName;
    let country = await Country.findOne({ name: countryName });
    if (country)
        return res.status(200).send(country);
    return res.status(404).send(`Country with name ${countryName} not exists`);
});

router.post("/country", authenticate, async (req, res) => {
    debug("===> POST /countries");
    debug(`request body is`);
    debug(req.body);

    if (req.user.role !== "superUser")
        return res.status(403).send("Forbidden. Only superUsers can create country!");

    let request = {
        countryName: req.body.countryName
    };

    const { error } = validateCreateCountry(request);
    if (error)
        return res.status(400).send(error.details[0].message);

    let findedcountry = await Country.findOne({ name: request.countryName });
    if (findedcountry)
        return res.status(400).send(`Country with name ${request.countryName} already exists`);

    let countryToCreate = { name: request.countryName };
    const { error1 } = validateCountry(countryToCreate);
    if (error1)
        return res.status(400).send(error1.details[0].message);
    let createdCountry = await Country.create(countryToCreate);

    let countryDto = {
        countryName: createdCountry.name,
        todayCases: createdCountry.todayCases,
        todayDeaths: createdCountry.todayDeaths,
        todayRecovered: createdCountry.todayRecovered,
        critical: createdCountry.critical,
        createdAt: createdCountry.createdAt,
        updatedAt: createdCountry.updatedAt
    }

    return res.status(200).send(countryDto);
});

router.put("/country", authenticate, async (req, res) => {
    debug("===> PUT /countries");
    debug(`request body is`);
    debug(req.body);

    if (req.user.role !== "superUser")
        return res.status(403).send("Forbidden. Only superUsers can edit permissions!");

    let request = {
        countryName: req.body.countryName,
        adminIds: req.body.adminIds,
        add: req.body.add
    };

    const { error } = validateAddPremission(request);
    if (error)
        return res.status(400).send(error.details[0].message);

    let findedCountry = await Country.findOne({ name: request.countryName });
    if (!findedCountry)
        return res.status(400).send(`Country with name ${request.countryName} does not exists`);

    _.forEach(request.adminIds, async (id) => {
        let adminUser = await User.findOne({ _id: id });

        if (!adminUser)
            return res.status(400).send(`User with id ${id} does not exists`);
    });

    if (request.add)
        _.forEach(request.adminIds, async (id) => {
            let adminUser = await User.findOne({ _id: id });
            let permissionExist = await User.findOne({ _id: id, allowedCountries: findedCountry._id });
            if (!permissionExist)
                adminUser.allowedCountries.push(findedCountry._id);
            await adminUser.save();
        });

    if (!request.add)
        _.forEach(request.adminIds, async (id) => {
            let adminUser = await User.findOne({ _id: id });
            let permissionExist = await User.findOne({ _id: id, allowedCountries: findedCountry._id });
            if (permissionExist)
                adminUser.allowedCountries.remove(findedCountry._id);
            await adminUser.save();
        });

    return res.status(200).send();
});

router.put("/:countryName", authenticate, async (req, res) => {
    debug("===> PUT /countries/:countryName");
    debug(`request body is`);
    debug(req.body);

    if (req.user.role !== "admin")
        return res.status(403).send("Forbidden. Only admin can update country!");

    let request = {
        countryName: req.params.countryName,
        todayCases: req.body.todayCases,
        todayDeaths: req.body.todayDeaths,
        todayRecovered: req.body.todayRecovered,
        critical: req.body.critical,
    };

    const { error } = validateUpdateCountry(request);
    if (error)
        return res.status(400).send(error.details[0].message);

    let findedCountry = await Country.findOne({ name: request.countryName });
    if (!findedCountry)
        return res.status(400).send(`Country with name ${request.countryName} does not exists`);

    let permissionExist = await User.findOne({ username: req.user.username, allowedCountries: findedCountry._id });

    if (!permissionExist)
        return res.status(403).send(`User ${req.user.username} does not have permission to modify Country ${request.countryName}`);

    findedCountry.todayCases = request.todayCases;
    findedCountry.todayDeaths = request.todayDeaths;
    findedCountry.todayRecovered = request.todayRecovered;
    findedCountry.critical = request.critical;

    await findedCountry.save();

    return res.status(200).send(findedCountry);
});

function validateCreateCountry(request) {
    const schema = Joi.object({
        countryName: Joi.string().required()
    });

    return schema.validate(request);
}

function validateAddPremission(request) {
    const schema = Joi.object({
        countryName: Joi.string().required(),
        adminIds: Joi.array().required(),
        add: Joi.boolean().required()
    });

    return schema.validate(request);
}

function validateUpdateCountry(request) {
    const schema = Joi.object({
        countryName: Joi.string().required(),
        todayCases: Joi.number().required(),
        todayDeaths: Joi.number().required(),
        todayRecovered: Joi.number().required(),
        critical: Joi.number().required(),
    });

    return schema.validate(request);
}

module.exports = router;