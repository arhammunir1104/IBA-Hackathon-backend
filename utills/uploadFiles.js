   
import streamifier  from 'streamifier';
import {v2 as cloudinary} from "cloudinary";
   
   // Loop through the array of files and upload them
    const uploadFiles = (files, path) =>{
        const result = files.map(async (file) => {
            try {
                // Create a promise for each file upload
                const uploadResult = new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream({
                        folder: path,
                        public_id: file.originalname, // Keep the original file name
                        resource_type: 'auto', // Auto detects the file type (image, video, etc.)
                    }, (error, result) => {
                        if (error) {
                            reject(error);
                        } else {                            
                            resolve({
                                public_id: result.public_id, // Public ID of the uploaded file
                                secure_url: result.secure_url, // URL of the uploaded file
                                format : result.resource_type  //image, video, raw for documents
                            });
                        }
                    });
    
                    // Convert the buffer into a stream and pipe it to Cloudinary
                    streamifier.createReadStream(file.buffer).pipe(uploadStream);
                });
    
                // Return the upload promise
                return uploadResult;
            } catch (error) {
                console.log('Upload stream error:', error);
                throw error;
            }
        });

        return result;
    }

    export default uploadFiles;