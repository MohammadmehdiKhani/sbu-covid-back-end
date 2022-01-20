const mongoose = require("mongoose");
const config = require("config");
const bcrypt = require("bcrypt");
const { User } = require("./schema/userSchema");

function connectToDb() {
    var dbUrl = config.get("DB_URL");
    mongoose.connect(dbUrl)
        .then(async () => {
            console.log("connect to db successfully");
            await initDb();
        })
        .catch(() => console.log("failed to connect to db"));
}

/*
this function check if any user with role superUser exist in db
if there is not such a user, default user inserted to db
username and password readed from *.json (config) or custom-environment-variable
according to value of $node_env
*/

async function initDb() {
    let superUsers = await User.find({ role: "superUser" });
    if (superUsers.length)
        return;

    let superUser = { username: config.get("SUPERUSER.USERNAME"), password: config.get("SUPERUSER.PASSWORD"), role: "superUser" };
    const salt = await bcrypt.genSalt(10);
    superUser.password = await bcrypt.hash(superUser.password, salt);
    await User.create(superUser);
}

module.exports = connectToDb;