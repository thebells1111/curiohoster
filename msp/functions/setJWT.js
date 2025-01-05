import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { encrypt } from "../../functions/ciphers.js";

dotenv.config();
const { MSP_JWT } = process.env;

export default async function (res, email) {
  if (email) {
    const msp = await encrypt(email, MSP_JWT);
    const newMspToken = jwt.sign({ msp }, MSP_JWT, {
      expiresIn: "10d",
    });

    res.cookie("msp", newMspToken, {
      maxAge: 10 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      path: "/",
      sameSite:
        process?.env?.NODE_ENV?.trim() !== "development" ? "none" : "lax",
      secure: process?.env?.NODE_ENV?.trim() !== "development",
    });
  }
}
