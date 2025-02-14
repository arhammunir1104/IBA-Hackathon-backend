import express from "express";
import userRouter from "../route/userRoute.js";
import cors from "cors";
import "dotenv/config"

const app = express();
const port = process.env.PORT || 3000;



//Databast
import("../config/mongodb.js")


app.get('/', (req, res) => {
    res.send(`Hello world`);
});


app.use(express.json());
app.use(cors());


app.use("/api/user", userRouter)



app.listen(port ,() =>{
    console.log(`Server is connected to port : ${port}`)
})

