import mongoose from "mongoose";

const projectDownloadSchema = new mongoose.Schema({
    userId : {type :  mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    userDownloads : {type : Array, default : []},
    projectId : {type :  mongoose.Schema.Types.ObjectId, ref: 'project', default: null},

}, {minimize : false, timestamps : true});

const projectDownloadModel = mongoose.model.projectDownload || mongoose.model("projectDownload", projectDownloadSchema);

export default projectDownloadModel;