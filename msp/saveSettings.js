import express from "express";
import { getCollection } from "./database/_db/connect.js";
import getEmailAddress from "./functions/getEmailAddress.js";
import { encrypt } from "../functions/ciphers.js";
import dotenv from "dotenv";

dotenv.config();

const { MSP_JWT } = process.env;

const _settings = {
  bunny: {
    username: "",
    hostname: "",
    password: "",
    apiKey: "",
  },
};

const saveSettings = async (req, res, next) => {
  try {
    const collection = await getCollection("msp-users");
    let email = await getEmailAddress(req);
    const settings = req.body;

    if (!email) {
      res.cookie("msp", "", {
        maxAge: 0,
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: process.env.NODE_ENV !== "development",
      });
      return res.status(401).json({ status: 401, message: "Token not found" });
    }

    // Fetch existing settings to preserve current values
    const existingUser = await collection.findOne({ email });
    const existingSettings = mergeSettings(
      _settings,
      existingUser?.settings || {}
    );
    const newSettings = mergeSettings(_settings, settings);

    console.log(newSettings);

    //handle hiding password stuff so they aren't updated when hidden
    if (settings?.bunny?.password === "********") {
      newSettings.bunny.password = existingSettings?.bunny?.password || "";
    } else if (settings?.bunny?.password) {
      newSettings.bunny.password = await encrypt(
        newSettings.bunny.password,
        MSP_JWT
      );
    }

    if (settings?.bunny?.apiKey === "********") {
      newSettings.bunny.apiKey = existingSettings?.bunny?.apiKey || "";
    } else if (settings?.bunny?.apiKey) {
      newSettings.bunny.apiKey = await encrypt(
        newSettings.bunny.apiKey,
        MSP_JWT
      );
    }

    await collection.updateOne(
      { email },
      {
        $set: { settings: newSettings },
      }
    );

    res.status(200).json({
      status: "success",
      message: "Settings updated successfully",
    });
  } catch (err) {
    console.error("Error in saveSettings function: " + err.message);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// Middleware to parse JSON body
export const middleware = [express.json(), saveSettings];

export default saveSettings;

function mergeSettings(target, source) {
  const result = Array.isArray(target) ? [] : {};

  Object.keys(target).forEach((key) => {
    result[key] = target[key]; // Copy existing settings
  });

  Object.keys(source).forEach((key) => {
    if (typeof source[key] === "object" && source[key] !== null) {
      // Handle nested objects
      result[key] = Array.isArray(source[key]) ? [] : {};
      result[key] = mergeSettings(result[key], source[key]); // Recursively merge
    } else {
      result[key] = source[key]; // Overwrite or add new keys
    }
  });

  return result;
}
