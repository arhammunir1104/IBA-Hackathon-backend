import multer from "multer";

const storage = multer.memoryStorage();

const uploadMem = multer({storage});
export default uploadMem;