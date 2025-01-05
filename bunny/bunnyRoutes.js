import express from "express";
import uploadFile from "./uploadFile.js";

const router = express.Router();

router.use("/uploadfile", uploadFile);

export default router;
