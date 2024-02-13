import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const mongoUrl = process.env.MONGODB_URL;

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${mongoUrl}/${DB_NAME}`)
        console.log(`\n MongoDB connected ! DB Host : ${connectionInstance.connection.host}`); // This will give the host name 
    } catch (error) {
        console.log("MongoDb conection error: ", error);
        process.exit(1);
    }
} 

export default connectDB;