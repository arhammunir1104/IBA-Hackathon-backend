import jwt from "jsonwebtoken";
import ErrorHandler from "../utills/ErrorHandler.js";



const authSingleFile = async (req, res, next) =>{

    try{

        const {token} = req.headers;

        console.log(token);

        if(!token) {
            req.body.isUser = false;
            req.body.userId = null;
            next();
        }
        else{
            const token_decode  = jwt.verify(token, process.env.JWT_SECRET);

            if(!token_decode){
                return next(new ErrorHandler("You are not authorized", 400));
            };

            req.body.userId = token_decode.id;
            req.body.isUser = true;
            next();

        }
    }
    catch(e){
        console.log(e);
        return next(new ErrorHandler(e.message, 400))
    }


};


export default authSingleFile;