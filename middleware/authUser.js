import jwt from "jsonwebtoken";
import ErrorHandler from "../utills/ErrorHandler.js";



const authUser = async (req, res, next) =>{

    try{

        const {token} = req.headers;

        console.log(token);

        if(!token) {
            return next(new ErrorHandler("You are not authorize" , 400));
        };

        const token_decode  = jwt.verify(token, process.env.JWT_SECRET);

        if(!token_decode){
            return next(new ErrorHandler("You are not authorized", 400));
        };

        req.body.userId = token_decode.id;
        next();

    }
    catch(e){
        console.log(e);
        return next(new ErrorHandler(e.message, 400))
    }


};


export default authUser;