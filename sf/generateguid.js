import { v4 as uuidv4 } from "uuid";
import { getCollection } from "./database/_db/connect.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const { JWT } = process.env;

const MAX_AGE = 10 * 24 * 60 * 60;

const createCookie = (name, value, maxAge) =>
  `${name}=${value}; Max-Age=${maxAge}; httpOnly; path=/; sameSite=none;  ${
    process.env.NODE_ENV === "development" ? "" : "secure"
  }`;

export default async function (req, res) {
  try {
    const collection = await getCollection("sharedValueLinks");
    const cookies = req.cookies;
    const token = cookies.ss;

    if (!token) {
      throw new Error("Token not found");
    }

    const { email } = jwt.verify(token, JWT);

    // Generate GUID and check if it exists in sharedValueLinks array
    let guid;
    let sharedValueLink;
    do {
      guid = uuidv4();
      sharedValueLink = await collection.findOne({ guid });
    } while (sharedValueLink);

    await collection.insertOne({ guid, email });

    const newToken = jwt.sign({ email, valueGuid: guid }, JWT, {
      expiresIn: "10d",
    });

    res.setHeader("set-cookie", [createCookie("ss", newToken, MAX_AGE)]);
    res.status(200).json({
      status: "success",
      guid, // Return the newly generated GUID
    });
  } catch (err) {
    console.error("generateGuid: " + err);
    res
      .status(500)
      .cookie("ss", "", {
        maxAge: 0,
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: process.env.NODE_ENV !== "development",
      })
      .json({
        status: 500,
        error: "A server error occurred",
      });
  }
}
