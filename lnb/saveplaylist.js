import express from "express";
import uploadFile from "../bunny/uploadFile.js";

import dotenv from "dotenv";

dotenv.config();

const {
  LNB_BUNNY_HOSTNAME,
  LNB_BUNNY_USERNAME,
  LNB_BUNNY_PASSWORD,
  LNB_BUNNY_API_KEY,
} = process.env;

const router = express.Router();

router.post("/", async (req, res) => {
  // Error handling for missing bunny settings
  if (
    !LNB_BUNNY_HOSTNAME ||
    !LNB_BUNNY_USERNAME ||
    !LNB_BUNNY_PASSWORD ||
    !LNB_BUNNY_API_KEY
  ) {
    return res.status(400).json({
      message:
        "Missing required bunny settings: hostname, username, password, or apiKey.",
    });
  }

  let bunnySettings = {
    hostname: LNB_BUNNY_HOSTNAME,
    username: LNB_BUNNY_USERNAME,
    password: LNB_BUNNY_PASSWORD,
    apiKey: LNB_BUNNY_API_KEY,
  };
  // Call the uploadFile function with req, res, and bunnySettings
  uploadFile(req, res, bunnySettings);
});

export default router;
