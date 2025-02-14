import "dotenv/config"
import mongoose from "mongoose";

mongoose.connect(`${process.env.DB_URL}`, {
    connectTimeoutMS : 3000,
}).then(()=>{
    console.log("Database connection established");
}).catch((e) =>{
    console.log("Database Error Message", e.message);
    console.log("Database Error", e);
})