import { decrypt } from "../../functions/ciphers.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const { MSP_JWT } = process.env;

export default async function getEmailAddress(req) {
  const cookies = req.cookies;
  const mspToken = cookies.msp;
  let msp;
  let email;
  if (mspToken) {
    msp = jwt.verify(mspToken, MSP_JWT)?.msp;
  }

  if (msp) {
    email = await decrypt(msp, MSP_JWT);
  }

  return email;
}
