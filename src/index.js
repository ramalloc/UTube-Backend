// require('dotenv').config({path: './env'});
import dotenv from "dotenv";

import connectDB from "./db/database.js";
import { app } from "./app.js";
dotenv.config(
    {
        path: "./env"
    }
)

const port = process.env.PORT || 8000;

connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`App is listening at port no. ${port}`);
    });
    app.on("error", (error) => {
        console.log("ERROR : ", error);
        throw error;
    })
})
.catch((err) => {
    console.log("Mongo db connection failed : ", err);
})























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