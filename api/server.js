
import "dotenv/config";
import express from "express";
import userRouter from "../route/userRoute.js";
import cors from "cors";
import projectRouter from "../route/projectRoute.js";
import connectCloudinary from "../config/cloudinary.js";

const app = express();
const port = process.env.PORT || 3000;



//Databast
import("../config/mongodb.js");

// cloudinary 
connectCloudinary();



app.get('/', (req, res) => {
    res.send(`Hello world`);
});


app.use(express.json());
app.use(cors());


app.use("/api/user", userRouter)
app.use("/api/project", projectRouter)




app.listen(port ,() =>{
    console.log(`Server is connected to port : ${port}`)
})

