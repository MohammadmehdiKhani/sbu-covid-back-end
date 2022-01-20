const Joi = require("joi");
const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100
    },
    todayCases: {
        type: Number,
        minimum: 0,
        default: 0
    },
    todayDeaths: {
        type: Number,
        default: 0
    },
    todayRecovered: {
        type: Number,
        minimum: 0,
        default: 0
    },
    critical: {
        type: Number,
        minimum: 0,
        default: 0
    }
}, { timestamps: true });

const Country = mongoose.model("Country", countrySchema);

function validateCountry(country) {
    const schema = Joi.object({
        name: Joi.string().alphanum().min(3).max(100),
        todayCases: Joi.number().greater(0),
        todayDeaths: Joi.number().greater(0),
        todayRecovered: Joi.number().greater(0),
        critical: Joi.number().greater(0),
    });
    return schema.validate(country);
}

exports.Country = Country;
exports.validateCountry = validateCountry;