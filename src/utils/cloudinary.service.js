import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

import {
    cloudinaryCloudName,
    cloudinaryApiKey,
    cloudinaryApiSecret,
} from "./envExporter";

// Now we will configure cloudinary
cloudinary.config({ 
  cloud_name: cloudinaryCloudName, 
  api_key: cloudinaryApiKey, 
  api_secret: cloudinaryApiSecret 
});

const uploadCloudiniary =  async (filePath) => {
    try {
        // If didn't get the filePath
        if(!filePath){
            console.log("File Path Not found/Get from File System");
            return null;
        }
        const response = await cloudinary.uploader.upload(filePath, 
            // resource_type detect the type of file automatically
            {
                resource_type: "auto"
            }
            )
        
            // File uploaded successfully then we will return the response to user
            console.log("File is Uploaded on Cloudinary",response.url);
            return response;
    } catch (error) {
        
        fs.unlinkSync(filePath);
        console.log("File Deleted from local Server as file didn't uploaded on cloudinary");
        return null;
    }
}

export {uploadCloudiniary}