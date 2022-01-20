const express = require("express");
const config = require("config");
const debug = require("debug")("app:debug");
const bodyPrser = require("body-parser");
const db = require("./database/db");
const authenticate = require("./middleware/authMid");

const authRoutes = require("./route/authRoutes");
const userRoutes = require("./route/userRoutes");
const countryRoutes = require("./route/countryRoutes");

const app = express();
debug(app.get("env"));
const port = config.get("PORT");

/*
add json and body parser middleware to read json body of http requests
*/
app.use(express.json())
app.use(bodyPrser.urlencoded({ extended: false }));

/*
direct each request to separate path (in separate file)
for better isolation
*/
app.use("/auth", authRoutes);
app.use("/admin", userRoutes);
app.use("/countries", countryRoutes);

/*
connect to db
*/
db();
const server = app.listen(port, () => console.log(`Start server on port ${port}`));