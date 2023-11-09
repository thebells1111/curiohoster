import express from "express";
import getlibrary from "./getlibrary.js";
import { middleware as generateSaveLibraryMiddleware } from "./savelibrary.js";
import { middleware as generateSavePlaylistMiddleware } from "./saveplaylist.js";

const router = express.Router();

router.post("/savelibrary", generateSaveLibraryMiddleware);
router.post("/saveplaylist", generateSavePlaylistMiddleware);

router.get("/getlibrary", (req, res, next) => {
  getlibrary(req, res, next);
});

export default router;
