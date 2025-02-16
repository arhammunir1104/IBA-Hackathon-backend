import express from "express";
import ErrorHandler from "./ErrorHandler.js";

export const ErrorMiddleware= (err, req, res, next )=>{
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    
    //wrong mongodb id
    if(err.name === "castError"){
        const message = `Resource not found. Invalid ${err.path}`;
        err = new ErrorHandler(message, 400);
    } 

     //duplicate key error
     if(err.code === 11000){
        const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
        err = new ErrorHandler(message, 400);
    }

    //wrong jwt error
    if(err.name === "jsonWebToken"){
        const message = "Invalid token. Please login again.";
        err = new ErrorHandler(message, 400);
    }

    //wrong jwt error
    if(err.name === "TokenExpiredError"){
        const message = "Token Expired. Please login again.";
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
        success : false,
        status : "fail",
        message : err.message
    })
};
