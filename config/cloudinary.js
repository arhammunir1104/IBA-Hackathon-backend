import "dotenv/config";
import {v2 as cloudinary} from "cloudinary";

console.log("Cloudinar credentail ", process.env.CLOUDINARY_NAME);

const connectCloudinary = async () =>{
    cloudinary.config({
        cloud_name : process.env.CLOUDINARY_NAME,
        api_key : process.env.CLOUDINARY_API_KEY,
        api_secret : process.env.CLOUDINARY_SECRET_KEY
    })
};

export default  connectCloudinary;