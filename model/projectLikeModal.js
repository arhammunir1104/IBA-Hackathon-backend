import mongoose from "mongoose";

const projectLikeModalSchema = new mongoose.Schema({
    userId : {type :  mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    likedUsers : {type : Array, default : []},
    projectId : {type :  mongoose.Schema.Types.ObjectId, ref: 'project', default: null},

}, {minimize : false, timestamps : true});

const projectLikeModal = mongoose.model.projectLike || mongoose.model("projectLike", projectLikeModalSchema);

export default projectLikeModal;