import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    category : {type : String, default : ""},
    title : {type : String, default : ""},
    userId : {type : mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    des : {type : String, default : ""},
    content_link : {type : Array, default : []},
    tags : {type : Array, default : []},
    status : {type : String, default : ""}, //public, paid, private    
    paidUsers : {type :  mongoose.Schema.Types.ObjectId, ref: 'paidUser', default: null},
    projectPrice : {type : Number, default : 0},
    likedUsers :  {type :  mongoose.Schema.Types.ObjectId, ref: 'projectLike', default: null},
    downloadUsers : {type :  mongoose.Schema.Types.ObjectId, ref: 'projectDownload', default: null},

}, {minimize : false, timestamps : true});

const projectModel = mongoose.model.project || mongoose.model("project", projectSchema);

export default projectModel;