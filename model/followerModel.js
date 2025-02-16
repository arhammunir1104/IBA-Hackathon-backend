import mongoose from "mongoose";

const followeSchema = new mongoose.Schema({
    userId : {type :  mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    followers : {type : Array, default : []}

}, {minimize : false, timestamps : true});

const followerModel = mongoose.model.follower || mongoose.model("follower", followeSchema);

export default followerModel;