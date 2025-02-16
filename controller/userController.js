import "dotenv/config"
import ErrorHandler from "../utills/ErrorHandler.js"
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../model/userModel.js";
import followerModel from "../model/followerModel.js";
import paidUserModel from "../model/paidUserModel.js";
import projectModel from "../model/projectModel.js";
import streamifier  from 'streamifier';

import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import moment from "moment";
import uploadFiles from "../utills/uploadFiles.js";
import projectLikeModal from "../model/projectLikeModal.js";
import projectDownloadModel from "../model/downloadModal.js";




//Register user
const registerUser = async (req, res, next) =>{
    try{
        const {name, email, password, registerType} = req.body;

        if(registerType === "google"){

            const isUser = await userModel.findOne({email: email});

            if(isUser !== undefined){
                return next(new ErrorHandler( "This email already exists.", 400));
            }
        
        if(!name || !email){
            return next(new ErrorHandler( "Please Enter all Details", 400));
        }
        if(!validator.isEmail(email)){
            return next(new ErrorHandler( "Please Enter valid Email.", 400))   
        }

        const userData = {
            name,
            email,
            registerType,
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);

        res.status(200).json({status : "success", message : "Account Created Successfully." ,token})
        }
        else{

            if(!name || !email || !password){
                return next(new ErrorHandler( "Please Enter all Details", 400))
            }
            if(!validator.isEmail(email)){
                return next(new ErrorHandler( "Please Enter valid Email.", 400))   
            }
            const isUser = await userModel.findOne({email: email});

            if(isUser !== undefined){
                return next(new ErrorHandler( "This email already exists.", 400));
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
                password : hashedPassword,
                registerType
            };
    
            const newUser = new userModel(userData);
            const user = await newUser.save();

            const followerDoc = await followerModel.create({
                userId : user._id,
            })

            user.followers = followerDoc._id
            await user.save();
    
            const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
    
            res.status(200).json({status : "success", message : "Account Created Successfully." ,token})
        }

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
        const {email, password, loginType} = req.body;

        if(loginType === "google"){
            
            const user = await userModel.findOne({email});

            if(!user){
                return next(new ErrorHandler( "User doen't exist.", 400))
            }
    
    
                const token = jwt.sign({id : user._id}, process.env.JWT_SECRET);
                res.status(200).json({status : "success", message : "Login Successfully." ,token})
            
        }
        else{
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
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};



// Get user profile data
const getNavlinkData = async (req, res, next) =>{
    try{
     const {userId} = req.body;

     const userData = await userModel.findById(userId).select({
        name : 1,
        image : 1,
     });

     res.status(200).json({status : "success", data:userData});
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};


// Get user profile data
const getProfile = async (req, res, next) =>{
    try{
     const {userId} = req.body;

     const userData = await userModel.findById(userId).select({
        name : 1,
        email : 1,
        image : 1,
        des  : 1,
        socialProfile : 1,
     });

     res.status(200).json({status : "success", data:userData});
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};

 
// Update profile data
const updateProfile = async (req, res, next) =>{
    try{
     const {userId, name, des, socialProfile } = req.body;
     const imageFile = req.file;
     console.log(req.body);
     if(!name || !des || !socialProfile){
        return next(new ErrorHandler( "Data Missing", 400));
    }

    await userModel.findByIdAndUpdate(userId, {name, des, socialProfile : JSON.parse(socialProfile)});

    if(imageFile){
        //upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
            folder : `/iba/${userId}/profile`,
            resource_type : "image"
        });
        const imageURL = imageUpload.secure_url;
        await  userModel.findByIdAndUpdate(userId, {image : imageURL});
    };

    res.status(200).json({status : "success", message : "Profile Updated"})

}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};




// Update profile data
const uploadProject = async (req, res, next) =>{
    try{
        const {
            userId, 
            title ,
            des,
            category,
            status,
            tags, //array
            projectPrice
        } = req.body;
        const files = req.files;

        const user = await userModel.findById(userId);

        if(!user){
            return next(new ErrorHandler( "User not found", 400));
        }

        if(!title || !des || !category || !status || !projectPrice){
            return next(new ErrorHandler( "Data Missing", 400));
        };

     

        const createProject = await projectModel.create({
            category,
            title,
            userId,
            des,
            status,
            tags : JSON.parse(tags),
            projectPrice : parseFloat(projectPrice)
        });

        const paidDb = await paidUserModel.create({
                userId : userId,
                projectId : createProject._id
            });

        const createLikeDB = await projectLikeModal.create({
            userId : userId,
            projectId : createProject._id
        });

        
        const createDownloadDB = await projectDownloadModel.create({
            userId : userId,
            projectId : createProject._id
        });

           
    

        // Wait for all uploads to finish
        const uploadedFiles = await Promise.all(uploadFiles(files,`/iba/${userId}/${createProject._id}`));
        console.log(uploadedFiles);

        const updateProject = await projectModel.findByIdAndUpdate(createProject._id, {downloadUsers : createDownloadDB._id,likedUsers : createLikeDB._id,paidUsers : paidDb._id,content_link : uploadedFiles});

        res.status(200).json({status : "success", message : "Files uploaded successfully."})


    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};



// like project
const likeProject = async (req, res, next) =>{
    try{
     const {userId, projectId } = req.body;

     const project = await projectModel.findOne({$and : [{_id : projectId}, {status : {$ne : "private"}}]});

     if(!project){
         return next(new ErrorHandler( "Project not found", 400));
     }

     const likeModal = await projectLikeModal.findOne({projectId});

     const isLiked = likeModal.likedUsers.includes(userId);

     if(isLiked){
         likeModal.likedUsers = likeModal.likedUsers.filter((id) => id!== userId);
     }
     else{
         likeModal.likedUsers.push(userId);
     }

     await likeModal.save();
     
     res.status(200).json({status : "success", message : `${isLiked ? "Unliked" : "Liked"}`})

}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};


const downloadProject = async (req, res, next) =>{
    try{
     const {userId} = req.body;
     const {projectId} = req.params;

     console.log(userId);

     const project = await projectModel.findOne({$and : [{_id : projectId}, {status : {$ne : "private"}}]});

     if(!project){
         return next(new ErrorHandler( "Project not found", 400));
     }

     const downloadModal = await projectDownloadModel.findOne({projectId});
     if(project.status === "public"){
        console.log("public")
        downloadModal.userDownloads.push(userId);
        await downloadModal.save();
         res.status(200).json({status : "success", message : `Download Started Successfully`, data : project.content_link});
     }
     const purchaseDB = await paidUserModel.findOne({projectId});

     if(purchaseDB.paidUsers.includes(userId)){
        downloadModal.userDownloads.push(userId);
        await downloadModal.save();
        res.status(200).json({status : "success", message : `Download Started Successfully`, data : project.content_link});
     }
     else{
        return next(new ErrorHandler( "Can not download the project.", 400))
     }
   

}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};


// follow user
const followUser = async (req, res, next) =>{
    try{
     const {userId, creatorId } = req.body;


     const creator = await userModel.findOne({_id : creatorId});

     if(!creator){
         return next(new ErrorHandler( "Creator not found", 400));
     }

     const followerModal = await followerModel.findOne({userId : creatorId});

     const isFollow = followerModal.followers.includes(userId);

     if(isFollow){
        followerModal.followers = followerModal.followers.filter((id) => id!== userId);
     }
     else{
        followerModal.followers.push(userId);
     }

     await followerModal.save();
     
     res.status(200).json({status : "success", message : `${isFollow ? "Unfollowd" : "Followed"}`})

}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};



// purchase project
const purchaseProject = async (req, res, next) =>{
    try{
     const {userId, projectId } = req.body;

     const project = await projectModel.findOne({$and : [{_id : projectId}, {status : "paid"}]});

     if(!project){
         return next(new ErrorHandler( "Project not found", 400));
     }

     const creator = await userModel.findOne({_id : project.userId});

     const user = await userModel.findOne({_id : userId});

     if(!user){
         return next(new ErrorHandler( "User not found", 400));
     }

     let projectPrice = project.projectPrice;

     let product = await stripe.products.create({
        name : `${project.title} By ${creator.name}`
    });
    if(product){
        let price = await stripe.prices.create({
            product : `${product.id}`,
            unit_amount : projectPrice*100 ,
            currency : "usd"
        });

        if(price.id){ 

            let customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
            });

            let session = await stripe.checkout.sessions.create({
                line_items : [{
                    price : `${price.id}`,
                    quantity : 1
                }], 
                mode : "payment",
                success_url : `${process.env.CLIENT_URL}/wallet/success?sessionId={CHECKOUT_SESSION_ID}`,
                cancel_url : `${process.env.CLIENT_URL}/wallet/`,
                customer: customer.id,
                metadata: {
                    userId,
                    projectId,
                    projectPrice
                },
                invoice_creation: {
                    enabled: true,
                }
            });

            res.status(200).json({status : "success", userStatus : "SUCCESS" , message : "Payment Session generated successfully" ,session : session.url});

        }
    }


}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};




// like project
const confirmProjectPayment = async (req, res, next) =>{
    try{

        let sessionId = req.body.sessionId;

        let session = await stripe.checkout.sessions.retrieve(sessionId);

        if(!session){
            return next(new ErrorHandler( "Invalid Session ID.", 400));
        }

        let customer = await stripe.customers.retrieve(session.customer);

        if(!customer){
            return next(new ErrorHandler( "Invalid Customer ID.", 400));
        }

        const project = await projectModel.findOne({_id : session.metadata.projectId}).select({paidUsers  :1});

        if(!project){
            return next(new ErrorHandler( "Project not found", 400));
        }

        const user = await userModel.findById(session.metadata.userId);

        const paidDb = await paidUserModel.findOne({_id : project.paidUsers});

        paidDb.paidUsers.push(session.metadata.userId);
        user.totalAmountEarned += parseFloat(session.metadata.projectPrice);
        user.totalAmountBalance += parseFloat(session.metadata.projectPrice);

        await paidDb.save();
        await user.save();

        res.status(200).json({status : "success", userStatus : "SUCCESS" , message : "Payment Confirmed."});
}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};




// creators page for viewer
const creatorPageViewer = async (req, res, next) =>{
    try{

        const {creatorId} = req.params;

        const creator = await userModel.findById(creatorId).select({
            name :1,
            image :1,
            des : 1,
            socialProfile : 1
        });

        // total followers
        const followerRecord =  await followerModel.findById(creator.followers);
        const totalFollowers= followerRecord ? followerRecord.followers.length : 0;

        // total projects
        const projects = await projectModel.find({userId : creatorId}).select({
            content_link : 0,
            tags : 0,
        });
        const totalProjects = projects.length;

        const finalProjects =await Promise.all(projects.map(async (val)=>{
            const likedRecord = await projectLikeModal.findById(val.likedUsers);
            const totalLiked = likedRecord ? likedRecord.likedUsers.length : 0;

            const downloadRecord = await projectDownloadModel.findById(val.downloadUsers);
            const totalDownload= downloadRecord ? downloadRecord.userDownloads.length : 0;

            const updatedData = { ...val._doc };

            updatedData.totalLikes = totalLiked;
            updatedData.totalDownloads = totalDownload;

            return updatedData;
        }));

        console.log(finalProjects);

        const totalUserLikes = finalProjects.reduce((acc, data)=>{
            return acc +=data.totalLikes;
        }, 0);

        const totalUserDownloads = finalProjects.reduce((acc, data)=>{
            return acc +=data.totalDownloads;
        }, 0);


        const finalData = {
            projects : finalProjects,
            creator : creator,
            totalFollowers : totalFollowers,
            totalProjects : totalProjects,
            totalUserLikes : totalUserLikes,
            totalUserDownloads : totalUserDownloads
        }

        res.status(200).json({status : "success", userStatus : "SUCCESS" , message : "Data Found Successfully",data: finalData });
}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};



// search projects
const searchProject = async (req, res, next) =>{
    try{

        const category = req.params.category;
        const query = req.params.query;

        const projects = await projectModel.find({$or : [
           { tags : {$in : [category, query]}},
           {title : {$regex : query, $options: 'i'}},
           {des : {$regex : query, $options: 'i'}},
        ]}).select({
            content_link : 0,
            tags : 0
        });

        const finalProjects = await Promise.all(projects.map(async (val)=>{ 
            const likedRecord = await projectLikeModal.findById(val.likedUsers);
            const totalLiked = likedRecord ? likedRecord.likedUsers.length : 0;

            const downloadRecord = await projectDownloadModel.findById(val.downloadUsers);
            const totalDownload= downloadRecord ? downloadRecord.userDownloads.length : 0;

            const updatedData = { ...val._doc };

            updatedData.totalLikes = totalLiked;
            updatedData.totalDownloads = totalDownload;

            return updatedData;
    }))

      res.status(200).json({status: 'success', data : finalProjects});
}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};





// user dashboard
const userDashboard = async (req, res, next) =>{
    try{

        const {userId} = req.body;
        
        const user = await userModel.findById(userId).select({
            password : 0, 
            isAccountComplete : 0,
            isEmailVerify : 0,
            isPhoneVerify : 0,
            registerType : 0,

        });


        
        // total followers
        const followerRecord =  await followerModel.findById(user.followers);
        const totalFollowers= followerRecord ? followerRecord.followers.length : 0;
        const followrsList = await Promise.all(followerRecord.followers.filter(async (val)=>{
            const userRecord = await userModel.findById(val);
            if(userRecord !== undefined){
                return val
            }
        }).map(async (val)=>{
            const userRecord = await userModel.findById(val);
            return {
                userId : userRecord._id,
                name : userRecord.name,
                image : userRecord.image
            }
        }));

        //total following
        const followingRecord =  await followerModel.find({followers : {$in : [userId]}});
        const totalFollowing= followingRecord ? followingRecord.length : 0;
        const followingList = await Promise.all(followingRecord.filter(async (val)=>{
            const userRecord = await userModel.findById(val.userId);
            if(userRecord !== undefined){
                return val
            }
        }).map(async (val)=>{
            const userRecord = await userModel.findById(val);
            return {
                userId : userRecord._id,
                name : userRecord.name,
                image : userRecord.image
            }
        }))

        // total projects
        const projects = await projectModel.find({userId}).select({
            content_link : 0,
            tags : 0,
        });


        const totalProjects = projects.length;

        const finalProjects =await Promise.all(projects.map(async (val)=>{
            const likedRecord = await projectLikeModal.findById(val.likedUsers);
            const totalLiked = likedRecord ? likedRecord.likedUsers.length : 0;

            const downloadRecord = await projectDownloadModel.findById(val.downloadUsers);
            const totalDownload= downloadRecord ? downloadRecord.userDownloads.length : 0;

            const updatedData = { ...val._doc };

            updatedData.totalLikes = totalLiked;
            updatedData.totalDownloads = totalDownload;

            return updatedData;
        }));



        const totalUserLikes = finalProjects.reduce((acc, data)=>{
            return acc +=data.totalLikes;
        }, 0);

        const totalUserDownloads = finalProjects.reduce((acc, data)=>{
            return acc +=data.totalDownloads;
        }, 0);


        const finalData = {
            projects : finalProjects,
            user : user,
            totalFollowers : totalFollowers,
            totalFollowing : totalFollowing,
            followerList : followrsList,
            followingList : followingList,
            totalProjects : totalProjects,
            totalUserLikes : totalUserLikes,
            totalUserDownloads : totalUserDownloads
        }

        res.status(200).json({status : "success", userStatus : "SUCCESS" , message : "Data Found Successfully",data: finalData });

        
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};



// single projects page of owner
const singleProjectOwner = async (req, res, next) =>{
    try{
        const {userId} = req.body;
        const {projectId} = req.params;

        const project = await projectModel.findOne({$and : [{_id : projectId},{userId}]});

        if(!project){
            return next(new ErrorHandler( "Project not found or is private.", 400))
        }

        const user = await userModel.findOne({_id : project.userId}).select({
            name : 1,
            image : 1,
            des : 1,
            socialProfile : 1,
            followers : 1
        });
        if(!user){
            return next(new ErrorHandler( "User not found.", 400))
        }

            const paidRecord = await paidUserModel.findById(project.paidUsers);
            const totalPaid = paidRecord ? paidRecord.paidUsers.length : 0;

            const paidList = await Promise.all(paidRecord.paidUsers.filter(async (val)=>{
                const userRecord = await userModel.findById(val);
                if(userRecord !== undefined){
                    return val
                }
            }).map(async (val)=>{
                const userRecord = await userModel.findById(val);
                return {
                    userId : userRecord._id,
                    name : userRecord.name,
                    image : userRecord.image
                }
            }));    


            const likedRecord = await projectLikeModal.findById(project.likedUsers);
            const totalLiked = paidRecord ? likedRecord.likedUsers.length : 0;
            const likedList = await Promise.all(likedRecord.likedUsers.filter(async (val)=>{
                const userRecord = await userModel.findById(val);
                if(userRecord !== undefined){
                    return val
                }
            }).map(async (val)=>{
                const userRecord = await userModel.findById(val);
                return {
                    userId : userRecord._id,
                    name : userRecord.name,
                    image : userRecord.image
                }
            }));  

            console.log(project)
            const downloadRecord = await projectDownloadModel.findById(project.downloadUsers);
            const totalDownload= paidRecord ? downloadRecord.userDownloads.length : 0;
            const downloadList = await Promise.all(downloadRecord.userDownloads.filter(async (val)=>{
                const userRecord = await userModel.findById(val);
                if(userRecord !== undefined){
                    return val
                }
            }).map(async (val)=>{
                const userRecord = await userModel.findById(val);
                return {
                    userId : userRecord._id,
                    name : userRecord.name,
                    image : userRecord.image
                }
            })); 

                 
        // Convert Mongoose documents to plain objects
        const projectData = project.toObject();
        const userData = user.toObject();

       
        const data = {
           project : projectData,
           user : userData,
           totalPaid,
           totalLiked,
           totalDownload,
           downloadList,
           likedList,
           paidList
        };
        res.status(200).json({status : "success", data});
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};



// like project
const donateUser = async (req, res, next) =>{
    try{
     const {userId, creatorId , DonatePrice} = req.body;


     const creator = await userModel.findOne({_id : creatorId});


     let product = await stripe.products.create({
        name : `Donate to ${creator.name}`
    });
    if(product){
        let price = await stripe.prices.create({
            product : `${product.id}`,
            unit_amount : DonatePrice*100 ,
            currency : "usd"
        });

        if(price.id){ 

            let customer = await stripe.customers.create({
                email: creator.email,
                name: creator.name,
            });

            let session = await stripe.checkout.sessions.create({
                line_items : [{
                    price : `${price.id}`,
                    quantity : 1
                }], 
                mode : "payment",
                success_url : `${process.env.CLIENT_URL}/donation/success?sessionId={CHECKOUT_SESSION_ID}`,
                cancel_url : `${process.env.CLIENT_URL}/wallet/`,
                customer: customer.id,
                metadata: {
                    creatorId,
                    DonatePrice
                },
                invoice_creation: {
                    enabled: true,
                }
            });

            res.status(200).json({status : "success", userStatus : "SUCCESS" , message : "Payment Session generated successfully" ,session : session.url});

        }
    }


}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};




// confirm donation price 
const confirmDonationPayment = async (req, res, next) =>{
    try{

        let sessionId = req.body.sessionId;

        let session = await stripe.checkout.sessions.retrieve(sessionId);

        if(!session){
            return next(new ErrorHandler( "Invalid Session ID.", 400));
        }

        let customer = await stripe.customers.retrieve(session.customer);

        const creator = await userModel.findById(session.metadata.creatorId);


        creator.totalAmountDonate += parseFloat(session.metadata.DonatePrice);
        creator.totalAmountBalance += parseFloat(session.metadata.DonatePrice);

        await creator.save();

        res.status(200).json({status : "success", userStatus : "SUCCESS" , message : "Payment Confirmed."});
}
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};




// all paid projects
const paidProjects = async (req, res, next) =>{
    try{

        const {userId} = req.body;
        const user = await userModel.findById(userId);

        const paidProject = await paidUserModel.find({paidUsers : {$in : [userId]}});

        const final = await Promise.all(paidProject.filter(async (val)=>{
            const projectRecord = await projectModel.findById(val.projectId);
            if(projectRecord !== undefined){
                return val
            }
        }).map(async (val)=>{
            const projectRecord = await projectModel.findById(val.projectId).select({
                content_link : 0,
                tags : 0
            });
            return projectRecord
        }));

        const finalProjects =await Promise.all(final.map(async (val)=>{
            const likedRecord = await projectLikeModal.findById(val.likedUsers);
            const totalLiked = likedRecord ? likedRecord.likedUsers.length : 0;

            const downloadRecord = await projectDownloadModel.findById(val.downloadUsers);
            const totalDownload= downloadRecord ? downloadRecord.userDownloads.length : 0;

            const updatedData = { ...val._doc };

            updatedData.totalLikes = totalLiked;
            updatedData.totalDownloads = totalDownload;

            return updatedData;
        }));


        res.status(200).json({status : "success", data: finalProjects});


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
    getNavlinkData,
    uploadProject,
    likeProject,
    followUser,
    purchaseProject,
    confirmProjectPayment,
    creatorPageViewer,
    downloadProject,
    searchProject,
    userDashboard,
    singleProjectOwner,
    donateUser,
    confirmDonationPayment,
    paidProjects
}