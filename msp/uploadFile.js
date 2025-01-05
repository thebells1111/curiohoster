import express from "express";
import uploadFile from "../bunny/uploadFile.js";
import { getCollection } from "./database/_db/connect.js";
import getEmailAddress from "./functions/getEmailAddress.js";
import { decrypt } from "../functions/ciphers.js";
import dotenv from "dotenv";

dotenv.config();

const { MSP_JWT } = process.env;

const router = express.Router();

router.post("/", async (req, res) => {
  // Fetch email address from the request
  const email = await getEmailAddress(req);

  // Fetch user settings from the database
  const collection = await getCollection("msp-users");
  const user = await collection.findOne({ email });
  const bunnySettings = user?.settings?.bunny;

  // Error handling for missing bunny settings
  if (
    !bunnySettings ||
    !bunnySettings.hostname ||
    !bunnySettings.username ||
    !bunnySettings.password ||
    !bunnySettings.apiKey
  ) {
    return res.status(400).json({
      message:
        "Missing required bunny settings: hostname, username, password, or apiKey.",
    });
  }

  console.log(bunnySettings);

  bunnySettings.password = await decrypt(bunnySettings.password, MSP_JWT);
  console.log(bunnySettings.password);
  bunnySettings.apiKey = await decrypt(bunnySettings.apiKey, MSP_JWT);
  // Call the uploadFile function with req, res, and bunnySettings
  uploadFile(req, res, bunnySettings);
});

export default router;
