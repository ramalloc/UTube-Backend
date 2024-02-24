import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

// Now we will configure cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
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
        
            
            // console.log("File is Uploaded on Cloudinary",response.url);
            // When file successfully uploaded then we will remove the file from file system. SO that memory will be cleaned for others. 
            fs.unlinkSync(filePath);
            // File uploaded successfully then we will return the response to user
            return response;
    } catch (error) {
        
        fs.unlinkSync(filePath);
        console.log("File Deleted from local Server as file didn't uploaded on cloudinary");
        return null;
    }
}

export {uploadCloudiniary}