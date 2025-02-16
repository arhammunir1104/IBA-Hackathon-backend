import express from "express";
import authUser from "../middleware/authUser.js";
import authSingleFile from "../middleware/authSingleFile.js";
import { deleteProject, editProject, singleProject } from "../controller/projectController.js";
import upload from "../middleware/multer.js";
import uploadMem from "../middleware/uploadProject.js";


const projectRouter = express.Router();


projectRouter.get("/singleProject/:projectId", authSingleFile ,singleProject);
projectRouter.delete("/my/project/:projectId", authUser ,deleteProject);
projectRouter.put("/my/project/:projectId",uploadMem.array("files"),authUser ,editProject);

export default projectRouter;