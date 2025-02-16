import mongoose from "mongoose";

const paidUserSchema = new mongoose.Schema({
    userId : {type :  mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    paidUsers : {type : Array, default : []},
    projectId : {type :  mongoose.Schema.Types.ObjectId, ref: 'project', default: null},

}, {minimize : false, timestamps : true});

const paidUserModel = mongoose.model.paidUser || mongoose.model("paidUser", paidUserSchema);

export default paidUserModel; 