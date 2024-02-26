import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload}  from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Makiing Route
router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }, 
    {
        name: "coverImage",
        maxCount: 1
    }
]) ,registerUser);

// Login Route
router.route("/login").post(loginUser);


// -- Secure Routes --
// Logout Route with auth middleware
router.route("/logout").post(verifyJWT, logoutUser);

// refresh token route
router.route("/refresh-token").post(refreshAccessToken);

export default router;

