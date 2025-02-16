import "dotenv/config"
import ErrorHandler from "../utills/ErrorHandler.js"
import userModel from "../model/userModel.js";
import projectModel from "../model/projectModel.js";
import paidUserModel from "../model/paidUserModel.js";
import projectLikeModal from "../model/projectLikeModal.js";
import followerModel from "../model/followerModel.js";
import projectDownloadModel from "../model/downloadModal.js";
import { downloadProject } from "./userController.js";
import uploadFiles from "../utills/uploadFiles.js";




const singleProject = async (req, res, next) =>{
    try{
        const {userId, isUser} = req.body;
        const {projectId} = req.params;


        if(isUser){
             const project = await projectModel.findOne({$and : [{_id : projectId}, {status : {$ne : "private"}}]});

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

        let totalPaid = null;

        if (project.status === "paid") {
            const paidRecord = await paidUserModel.findById(project.paidUsers);
            console.log("PaidRecod", paidRecord);
            totalPaid = paidRecord ? paidRecord.paidUsers.length : 0;
        }



        //check if the user has liked the project 
        let isUserLiked = false;
        const likeRecord = await projectLikeModal.findById(project.likedUsers);
        if(likeRecord && likeRecord.likedUsers.includes(userId)){
            isUserLiked = true;
        }
        console.log("isUserLiked", isUserLiked);

        //check if the user follows the creator
        let isFollowing = false;
        const followRecord = await followerModel.findById(user.followers);
        if(followRecord && followRecord.followers.includes(userId)){
            isFollowing = true;
        }

        console.log("isFollowing", isFollowing)

        //check if the user has purchased it in order if the project is paid
        let isUserPurchased = null;
        if(project.status === "paid"){
            const paidRecord = await paidUserModel.findById(project.paidUsers);
            if(paidRecord && paidRecord.paidUsers.includes(userId)){
                isUserPurchased = true;
            }
            else{
                isUserPurchased = false;
            }
        }

        

        

            const likedRecord = await projectLikeModal.findById(project.likedUsers);
            const totalLiked = paidRecord ? likedRecord.likedUsers.length : 0;

            const downloadRecord = await projectDownloadModel.findById(project.downloadUsers);
            const totalDownload= paidRecord ? downloadRecord.userDownloads.length : 0;

            
            const followerRecord =  await followerModel.findById(user.followers);
            const totalFollowers= followerRecord ? followerRecord.followers.length : 0;
        

        
        // Convert Mongoose documents to plain objects
        const projectData = project.toObject();
        const userData = user.toObject();

        const isAllowedDownload = project.status === "paid" && isUserPurchased === false ? false : true;

        const data = {
           project : projectData,
           creator : userData,
           totalPaid,
           isFollowing,
           isUserPurchased,
           isUserLiked,
           isAllowedDownload,
           isUser,
           totalLiked,
           totalDownload,
           totalFollowers
        };

        delete data.project.paidUsers;

        if(isUserPurchased  === false){
            delete data.project.content_link
        }

        res.status(200).json({status : "success", data});

        }
        else{
            console.log("Not a user")
            const project = await projectModel.findOne({$and : [{_id : projectId}, {status : {$ne : "private"}}]});

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
    
          let totalPaid = null;
    
            if (project.status === "private") {
                const paidRecord = await paidUserModel.findById(project.paidUsers);
                totalPaid = paidRecord ? paidRecord.paidUsers.length : 0;
            }

            
            const likedRecord = await projectLikeModal.findById(project.likedUsers);
            const totalLiked = paidRecord ? likedRecord.likedUsers.length : 0;

            const downloadRecord = await projectDownloadModel.findById(project.downloadUsers);
            const totalDownload= paidRecord ? downloadRecord.userDownloads.length : 0;

            
            const followerRecord =  await followerModel.findById(user.followers);
            const totalFollowers= followerRecord ? followerRecord.followers.length : 0;
    
            // Convert Mongoose documents to plain objects
            const projectData = project.toObject();
            const userData = user.toObject();
    
    
            const data = {
               project : projectData,
               creator : userData,
               totalPaid,
               isAllowedDownload : false,
               isUser,
               totalLiked,
               totalDownload,
               totalFollowers
            };
    
            delete data.project.paidUsers;        
            if(project.status !== "public"){
                delete data.project.content_link
            }


            res.status(200).json({status : "success", data});
        }
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};



const deleteProject = async (req, res, next) =>{
    try{
        const {userId} = req.body;
        const {projectId} = req.params;


        console.log(userId, projectId);

        const project = await projectModel.findOneAndDelete({$and : [{_id : projectId} , {userId : userId}]});
        const liked = await projectLikeModal.findOneAndDelete({$and : [{projectId} , {userId : userId}]});
        const paid = await paidUserModel.findOneAndDelete({$and : [{projectId} , {userId : userId}]});
        const download = await projectDownloadModel.findOneAndDelete({$and : [{projectId} , {userId : userId}]});
        
        if(!project){
            return next(new ErrorHandler( "Project not found or you are not the owner.", 400))
        }

        res.status(200).json({status : "success", message : "Project deleted successfully."})
      
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};







const editProject = async (req, res, next) =>{
    try{
        const {
            userId, 
            title ,
            des,
            category,
            status,
            tags, //array
            projectPrice,
            projectId
        } = req.body;

        console.log(req.body);
        const files = req.files;

        const project = await projectModel.findOne({$and : [{_id : projectId} , {userId : userId}]});
        
        if(!project){
            return next(new ErrorHandler( "Project not found.", 400));
        }
        
        
        const user = await userModel.findById(userId);

        if(!user){
            return next(new ErrorHandler( "User not found", 400));
        }

        if(!title || !des || !category || !status || !projectPrice || !tags){
            return next(new ErrorHandler( "Data Missing", 400));
        };

        
        project.title = title;
        project.des = des;
        project.category = category;
        project.status = status;
        project.tags = tags;
        project.projectPrice = projectPrice;

        await project.save();

        if(files.length > 0) {
            // Wait for all uploads to finish
            console.log(files, userId, project._id.toString())
        const uploadedFiles = await Promise.all(uploadFiles(files,`/iba/${userId}/${project._id.toString()}`));

        const updateProject = await projectModel.findByIdAndUpdate(project._id, {content_link : uploadedFiles});

        res.status(200).json({status : "success", message : "Files uploaded successfully."})
        }

        res.status(200).json({status : "success", message : "Project Updated successfully."});

       
      
    }
    catch(e){
        return next(new ErrorHandler( e.message, 400))
    }
};





export {
    singleProject,
    deleteProject,
    editProject
}