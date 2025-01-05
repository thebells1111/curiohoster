import express from "express"; // Express needed to use `express.json()`
import { getCollection } from "./database/_db/connect.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import setMspJWT from "./functions/setJWT.js";

dotenv.config();

const register = async (req, res, next) => {
  try {
    const collection = await getCollection("msp-users");
    const { email, password } = req.body;

    // Check if email already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "Email already in use",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save new user with upsert option
    await collection.updateOne(
      { email }, // Filter condition to match email
      {
        $set: {
          email,
          password: hashedPassword,
        },
      },
      { upsert: true }
    );

    // Set JWT after registration
    await setMspJWT(res, email);
    res.status(200).json({
      status: "success",
      message: "Credentials saved",
      email,
    });
  } catch (err) {
    console.error("Error in register function: " + err.message);
    res.status(500).json({ status: "error", error: err.message });
  }
};

// Middleware to parse JSON body
export const middleware = [express.json(), register];

export default register;
