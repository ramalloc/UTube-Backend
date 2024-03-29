import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.models.js"
import { uploadCloudiniary } from "../utils/cloudinary.service.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        // Getting the user info
        const user = await User.findById(userId);

        // Generating tokens for user
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Saving refreshToken into database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // returning the tokens
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError("500", "Something went wrong while generating tokens...");
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // Getting the data
    const { fullName, username, email, password } = req.body

    // Checking data is getting or not
    // console.log("email : ", email);

    // Validaion of Data 
    if (
        [username, fullName, email, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required...")
    }


    // User Existed or not
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with same email or username is already existed...")
    }

    // Checking Images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.file && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // Checking the the return response of req.files
    // console.log(req.files);

    if (!avatarLocalPath) {
        throw new ApiError(403, "Avatar file is required...")
    }

    // Uploading file if present
    const avatar = await uploadCloudiniary(avatarLocalPath);
    const coverImage = await uploadCloudiniary(coverImageLocalPath);

    // Checking Uploaded on CLoudinary or not
    if (!avatar) {
        throw new ApiError(405, "Avatar file is required...")
    }

    // Saving User Data in MongoDB using User Model
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase(),
        email
    })

    // Checking the uer created or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the User in Database...");
    }

    // Sending API Response with apiResponse Utility
    return res.status(200).json(
        new ApiResponse(201, createdUser, "User registered successfully...  ")
    )
})

// User Login
const loginUser = asyncHandler(async (req, res) => {
    // Getting Data
    const { username, email, password } = req.body

    // Validating username or email
    if (!(username || email)) {
        throw new ApiError(403, "username or email required...");
    }


    // Checking the user present or not in database
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    // checking and throwing error if user doesn't exists 
    if (!user) {
        throw new ApiError(402, "User doesn't exists...");
    }

    // Comparing Password and sending error
    const isPasswordValid = await user.isPasswordCorrect(password);

    // Checking password is corrector not
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Password...!");
    }


    // Generating Tokens for the user
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // Holding the details of user without password and refreshToken
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // Setting the cookie options so that it cannot be modified in frontend
    const options = {
        httpOnly: true,
        secure: true
    }

    // Returning response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully..."
            )
        )
})


// Logout Controller
const logoutUser = asyncHandler(async (req, res) => {

    // Finding User and updating refreshToken
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User Logged Out Successfully...!")
        )

})

// Endpoint for new access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;


    // Sending Error if there is no refresh token
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Access Request...!")
    }

    try {
        // Verifying token using jwt.verify() 
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        // Getting the user details from decodedToken 
        const user = await User.findById(decodedToken?._id);

        // If user is not present then sending error
        if (!user) {
            throw new ApiError(401, "Invalid refresh token...!")
        }

        // Matching incoming refresh token and user's saved refresh token
        if (user?.refreshToken != incomingRefreshToken) {
            throw new ApiError(401, "Refresh Token is expired...!")
        }

        // Refresh token matched then generate new access token and refresh token
        const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        // Writing options for cookies to send in response 
        const options = {
            httpOnly: true,
            secure: true
        }

        // Returning response and ApiResonse in json
        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access Token Refreshed Successfully..."
                )
            )
    } catch (error) {
        throw new ApiError(402, error?.message || "Invalid refresh token...!")
    }

})

// Changing password 
const changeCurrentPassword = asyncHandler(async (req, res) => {
    // Getting passwords from req
    const { oldPassword, newPassword } = req.body;

    try {
        // Getting user data from request and fincing in database
        const user = await User.findById(req.user?._id);

        // Comparing old Password with user's password
        const isPassword = await user.isPasswordCorrect(oldPassword);

        // Throwing error if password do not match
        if (!isPassword) {
            throw new ApiError(400, "Invalid Old Password...!");
        }

        // Setting the password
        user.password = newPassword;

        // Saving the password in database
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Password Changed Successfully...")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Password...!")
    }
})

// Getting Current User Controller
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current User Fetched Successfully...")
        )
})

// Account Details Updating Controller 
const updateAccountDetails = asyncHandler(async (req, res) => {

    // Getting data from request body
    const { fullName, email } = req.body;

    // Throwing Error if not getting data
    if (!fullName && !email) {
        throw new ApiError(401, "All fields are required...!")
    }

    // finding the user by _id from req.user in mongoDB and updating in it as well
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account Details Updated Successfully...")
        )

})

// Updating Avatar of User
const updateUserAvatar = asyncHandler(async (req, res) => {
    // Getting path of the file from multer req.file
    const avatarLocalPath = req.file?.path;

    // If path is not present then send error
    if (!avatarLocalPath) {
        throw new ApiError(403, "Avatar File is missing...!")
    }

    try {
        // Uploading the file on cloudinary with uploadCloudinary service 
        const avatar = await uploadCloudiniary(avatarLocalPath)

        // Checking avatar url in the returned data of cloudinary 
        if (!avatar.url) {
            throw new ApiError(400, "Error while uploading avatar...")
        }

        // Saving the avatar url in database
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: { avatar: avatar.url }
            },
            { new: true }
        ).select("-password")

        return res
            .status(200)
            .json(
                new ApiResponse(200, user, "Avatar File is Updated Successfully...")
            )
    } catch (error) {
        throw new ApiError(403, error?.message || "Avatar file is missing or unable to upload...!")
    }
})

// Updating Cover Image of User
const updatecoverImage = asyncHandler(async (req, res) => {
    // Getting path of the file from multer req.file
    const coverImageLocalPath = req.file?.path;

    // If path is not present then send error
    if (!coverImageLocalPath) {
        throw new ApiError(403, "Avatar File is missing...!")
    }

    try {
        // Uploading the file on cloudinary with uploadCloudinary service 
        const coverImage = await uploadCloudiniary(coverImageLocalPath)

        // Checking coverImage url in the returned data of cloudinary 
        if (!coverImage.url) {
            throw new ApiError(400, "Error while uploading avatar...")
        }

        // Saving the coverImage url in database
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: { coverImage: coverImage.url }
            },
            { new: true }
        ).select("-password")

        return res
            .status(200)
            .json(
                new ApiResponse(200, user, "Cover Image File is Updated Successfully...")
            )
    } catch (error) {
        throw new ApiError(403, error?.message || "Cover Image file is missing or unable to upload...!")
    }
})



// Get User/Channel Profile Details controller
const getUserChannelProfile = asyncHandler(async (req, res) => {
    // Getting Username from url
    const { username } = req.params;

    // If username is not present then sending error
    if (!(username.trim())) {
        throw new ApiError(400, "Username is missing...!")
    }

    // Writing Aggreagation pipelines
    const channel = await User.aggregate([
        // 1st pipeline to find user with $match property
        // Also filtered one document below
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        // 2nd pipeline to find subscriber of the above User using lookup
        // We are selecting channel in the subscription document 
        {
            $lookup: {
                from: "subscriprions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },

        // 3rd pipeline to get the user subscribed to channels using lookup
        {
            $lookup: {
                from: "subscriprions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },

        // Adding the above field in User Model with addField
        {
            $addFields: {
                // Counting subscriber with $size and naming the filed subscribersCount in User model
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscriberToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },

        // Projection - Here we project the channel values 
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscriberToCount: 1,
            }
        }
    ]);
    // TODO: console.log(channel) to see the return of aggregation pipeline

        // Aggregation Pipeline mostly returns array but the array[0] object is useful for us.
        // Checking if there is no channel length then return error 
        if(!channel.length){
            throw new ApiError(404, "Channel doesn't exist...!")
        }

        // Now if channel exists then we will return the channel 
        return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User Channel Details are fetched successfully...!")
        )
});


// Watch History controller with aggregation pipeline
const getWatchHistory = asyncHandler(async (req, res) => {
/* 
*/

const user = await User.aggregate([
    {
        $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                {
                    // Getting Owner details from user model
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        // projecting limited data in array
                        pipeline: [
                            {
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                // Extracting first object from the array returned by owner in previous pipeline so that it will be easy for frontend user. 
                {
                    $addFields: {
                        owner: {
                            $first: "$owner"
                        }
                    }
                }
            ]
        }
    }
])

// returning response 
return res
.status(200)
.json(
    new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully...")
)
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updatecoverImage,
    getUserChannelProfile,
    getWatchHistory
};