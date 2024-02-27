import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updatecoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
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
]), registerUser);

// Login Route
router.route("/login").post(loginUser);


// -- Secure Routes --
// Logout Route with auth middleware
router.route("/logout").post(verifyJWT, logoutUser);

// refresh token route
router.route("/refresh-token").post(refreshAccessToken);

// Change password route
router.route("/change-password").post(verifyJWT, changeCurrentPassword)

// Get Current user route
router.route("/current-user").post(verifyJWT, getCurrentUser)

// Update Account Details route
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

// Update user avatar route
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

// Update user cover image route
router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updatecoverImage)

// Getting details of user's channel route
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)

// Getting watch history 
router.route("/channel/watch-history").get(verifyJWT, getWatchHistory)




export default router;

