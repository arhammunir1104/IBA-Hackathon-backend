import "dotenv/config"
import ErrorHandler from "../utills/ErrorHandler.js"
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../model/userModel.js";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
import Stripe from 'stripe';
// import sendMail from "../utils/sendMail.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import moment from "moment";




//Register user
const registerUser = async (req, res, next) =>{
    try{
        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return next(new ErrorHandler( "Please Enter all Details", 400))
        }
        if(!validator.isEmail(email)){
            return next(new ErrorHandler( "Please Enter valid Email.", 400))   
        }
        if(password.length < 8){
            return next(new ErrorHandler( "Password must be greater than 8 characters.", 400))   
        }

        //hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password : hashedPassword
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);

        res.status(200).json({status : "success", message : "Account Created Successfully." ,token})
    }
    catch(e){
        if(e.code ===  11000){
            return next(new ErrorHandler( "This email already exists.", 400))
        }
        return next(new ErrorHandler( e.message, 400))
    }
};

 
//user login

const loginUser = async (req, res, next) =>{
    try{
        const {email, password} = req.body;
        
        console.log(req.body);

        const user = await userModel.findOne({email});

        if(!user){
            return next(new ErrorHandler( "User doen't exist.", 400))
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(isMatch){
            const token = jwt.sign({id : user._id}, process.env.JWT_SECRET);
            res.status(200).json({status : "success", message : "Login Successfully." ,token})
        }
        else{
            return next(new ErrorHandler( "Wrong Email or Password.", 400))
        }
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};


// Get user profile data
const getProfile = async (req, res, next) =>{
    try{
     const {userId} = req.body;

     const userData = await userModel.findById(userId).select("-password");

     res.status(200).json({status : "success", data:userData});
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};


// Update profile data
const updateProfile = async (req, res, next) =>{
    try{
     const {userId, name, phone, address,dob,gender} = req.body;
     const imageFile = req.file;
     if(!name || !phone ||  !address || !dob || !gender){
        return next(new ErrorHandler( "Data Missing", 400));
    }
    await userModel.findByIdAndUpdate(userId, {name, phone, address: JSON.parse(address), dob, gender});

    if(imageFile){
        //upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type : "image"});
        const imageURL = imageUpload.secure_url;
        await  userModel.findByIdAndUpdate(userId, {image : imageURL});
    };

    res.status(200).json({status : "success", message : "Profile Updated"})

}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};



export {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
   
}