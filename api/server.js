
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


// cors setup 
//Cors Setup 
let corsOptions = {
    origin: ["http://localhost:5173" ],
    methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
    credentials: true,
    optionsSuccessStatus: 204
}

app.use(express.json());


app.use(cors(corsOptions));


app.use("/api/user", userRouter)
app.use("/api/project", projectRouter)




app.listen(port ,() =>{
    console.log(`Server is connected to port : ${port}`)
})

