const Joi = require("joi");
const mongoose = require("mongoose");

/*
mongoose schema and Joi scehma for User document
*/

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 500
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "admin", "superUser"],
        default: "user"
    },
    allowedCountries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country",
        default: new Array()
    }]

}, { timestamps: true });

const User = mongoose.model("User", userSchema);

function validateUser(user) {
    const schema = Joi.object({
        username: Joi.string().min(5).max(50).required(),
        password: Joi.string().min(5).max(500).required(),
        role: Joi.string().required().valid("user", "admin", "superUser"),
    });
    return schema.validate(user);
}

exports.User = User;
exports.validateUser = validateUser;