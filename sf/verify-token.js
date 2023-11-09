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

export default async function verifyToken(req, res, next) {
  try {
    const cookies = req.cookies;
    let token = req.query.token || cookies.ss;
    const collection = await getCollection("users");

    if (!token) {
      res.setHeader("set-cookie", [createCookie("ss", "", 0)]);
      return res.status(401).json({ status: "fail", message: "invalid token" });
    }

    try {
      const decode = jwt.verify(token, JWT);
      const { email, valueGuid } = decode;
      let user = await collection.findOne({ email });

      if (!user) {
        user = { email, validatedFeeds: [] };
        await collection.insertOne(user);
      }
      const newToken = jwt.sign({ email, valueGuid }, JWT, {
        expiresIn: "10d",
      });
      res.setHeader("set-cookie", [createCookie("ss", newToken, MAX_AGE)]);
      return res.status(200).json({
        status: "success",
        user: {
          email: user.email,
          validatedFeeds: user.validatedFeeds,
        },
      });
    } catch (error) {
      console.log(error);
      res.setHeader("set-cookie", [createCookie("ss", "", 0)]);
      return res.status(401).json({ status: "fail", message: "invalid token" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }
}
