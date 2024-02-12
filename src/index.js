// require('dotenv').config({path: './env'});
import dotenv from "dotenv";

import connectionDB from "./db/database.js";
dotenv.config(
    {
        path: "./env"
    }
)


connectionDB()























/*
import express from "express"
const app = express();
const port = process.env.PORT || 8000;

;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("ERROR : ", error);
            throw error
        })

        app.listen(port, () => {
            console.log(`App is listening at port no. ${port}`);
        })
    } catch (error) {
        console.log("ERROR : ", error)
        throw error
    }
})()
*/