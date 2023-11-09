import express from "express";
import { middleware as generateguidMiddleware } from "./generateguid.js";
import deleteGuid from "./deleteguid.js";
import getevents from "./getevents.js";
import getblocks from "./getblocks.js";
import getvts from "./getvts.js";
import { middleware as generateSaveBlocksMiddleware } from "./saveblocks.js";
import { middleware as generateSaveSettingsMiddleware } from "./savesettings.js";
import getpromotion from "./getpromotion.js";
import lookup from "./lookup.js";

const router = express.Router();

router.post("/generateguid", generateguidMiddleware);
router.post("/saveblocks", generateSaveBlocksMiddleware);
router.post("/savesettings", generateSaveSettingsMiddleware);
router.get("/getevents", (req, res, next) => {
  getevents(req, res, next);
});
router.get("/deleteguid", (req, res, next) => {
  deleteGuid(req, res, next);
});
router.get("/getblocks", (req, res, next) => {
  getblocks(req, res, next);
});
router.get("/getpromotion", (req, res, next) => {
  getpromotion(req, res, next);
});
router.get("/getvts", (req, res, next) => {
  getvts(req, res, next);
});
router.get("/event/lookup", (req, res, next) => {
  lookup(req, res, next);
});

export default router;
