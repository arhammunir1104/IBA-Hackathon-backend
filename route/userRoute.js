import express from "express";
import authUser from "../middleware/authUser.js";
import { getProfile, loginUser, registerUser } from "../controller/userController.js"


const userRouter = express.Router();


userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/getProfile",authUser ,getProfile);


export default userRouter;