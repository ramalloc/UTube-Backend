import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import {uploadCloudiniary} from "../utils/cloudinary.service.js"
import {ApiResponse} from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    // Getting the data
    const { fullName, username, email, password } = req.body
    console.log("email : ", email);

    // Validaion of Data 
    if (
        [username, fullName, email, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required...")
    }


    // User Existed or not
    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })
    
    if(existedUser){
        throw new ApiError(409, "User with same email or username is already existed...")
    }

    // Checking Images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(403, "Avatar file is required...")
    }

    // Uploading file if present
    const avatar = await uploadCloudiniary(avatarLocalPath);
    const coverImage = await uploadCloudiniary(coverImageLocalPath);

    // Checking Uploaded on CLoudinary or not
    if(!avatar){
        throw new ApiError(405, "Avatar file is required...")
    }

    // Saving User Data in MongoDB using User Model
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password, 
        username: username.lowerCase(),
        email
    })

    // Checking the uer created or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the User in Database...");
    }

    // Sending API Response with apiResponse Utility
    return res.status(200).json(
        new ApiResponse(201, createdUser, "User registered successfully...  ")
    )
})

export { registerUser };