import express from "express";

import refresh from "./refresh.js";
import logout from "./logout.js";

import { middleware as registerMiddleware } from "./register.js";
import { middleware as loginMiddleware } from "./login.js";
import { middleware as saveSettingsMiddleware } from "./saveSettings.js";
import enclosure from "./enclosure.js";
import uploadFile from "./uploadFile.js";
const router = express.Router();

router.post("/login", loginMiddleware);
router.post("/register", registerMiddleware);
router.post("/savesettings", saveSettingsMiddleware);
router.get("/refresh", (req, res, next) => {
  refresh(req, res, next);
});
router.get("/logout", (req, res, next) => {
  logout(req, res, next);
});
router.get("/enclosure", (req, res, next) => {
  enclosure(req, res, next);
});
router.use("/uploadfile", uploadFile);

export default router;
