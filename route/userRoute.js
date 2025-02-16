import express from "express";
import authUser from "../middleware/authUser.js";
import { confirmDonationPayment, confirmProjectPayment, creatorPageViewer, donateUser, downloadProject, followUser, getNavlinkData, getProfile, likeProject, loginUser, paidProjects, purchaseProject, registerUser, searchProject, singleProjectOwner, updateProfile, uploadProject, userDashboard } from "../controller/userController.js"
import upload from "../middleware/multer.js";
import uploadMem from "../middleware/uploadProject.js";
import authSingleFile from "../middleware/authSingleFile.js";


const userRouter = express.Router();


userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/navData",authUser ,getNavlinkData);
userRouter.get("/getProfile",authUser ,getProfile);
userRouter.post("/updateProfile",upload.single("image") ,authUser , updateProfile);
userRouter.post("/uploadProject",uploadMem.array("files") ,authUser , uploadProject);
userRouter.put("/like",authUser ,likeProject);
userRouter.put("/follow",authUser ,followUser);
userRouter.post("/purchase",authUser ,purchaseProject);
userRouter.post("/confirmProjectPurchase",authUser ,confirmProjectPayment);
userRouter.get("/creator/:creatorId" ,creatorPageViewer);
userRouter.get("/download/:projectId",authUser ,downloadProject);
userRouter.get("/search/:category/:query" ,searchProject);
userRouter.get("/dashboard" ,authUser,userDashboard);
userRouter.get("/my/project/:projectId" ,authUser,singleProjectOwner);
userRouter.post("/donate" ,authSingleFile,donateUser);
userRouter.post("/confirmDonate" ,authSingleFile,confirmDonationPayment);
userRouter.get("/paid" ,authUser,paidProjects);


export default userRouter;