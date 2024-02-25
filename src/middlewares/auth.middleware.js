import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js"; 
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Getting the token from cookie of browser or from request header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        // If token is present then send an error
        if(!token){
            throw new ApiError(401, "Unauthorized request !")
        }
    
        // Decoding the token using jwt verify() method
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // Checking the user in mongoDB
        const user = await User.findById(decodedToken._id).select(" -password -refreshToken");
    
        // Now if user is not present then throw an error using ApiError()
        if(!user){
            throw new ApiError(401, "Invalid Access Token !")
        }
    
        // If user is present then we inject the data object in request and call next() in last
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token !");
    }
    
})

