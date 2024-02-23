import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));

app.use(cookieParser());


// importing user router
import userRouter from "./routes/user.routes.js";

// User Route Declaration
// app.use("/users", userRouter);
app.use("/api/v1/users", userRouter);


export { app }