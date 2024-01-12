"use strict";
require("dotenv").config();
const postString = require("./s3");
const convertToXML = require("./scraper");

module.exports.scrape = async function (event) {
    try {
        const xml = await convertToXML();
        await postString(xml);
        return { message: "jeopardy scraped successfully", event };
    } catch (err) {
        return { message: `jeopardy failed to scrape: ${err.stack}`, event };
    }
};
