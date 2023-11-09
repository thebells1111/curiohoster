import { getCollection } from "./database/_db/connect.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const { ALBY_JWT } = process.env;

export default async function (req, res, next) {
  try {
    const collection = await getCollection("sharedValueLinks");
    const cookies = req.cookies;
    const token = cookies.sawt || cookies.awt;
    if (!token) {
      throw new Error("Token not found");
    }

    const alby = jwt.verify(token, ALBY_JWT);

    const resolve = await axios({
      url: "https://api.getalby.com/user/value4value",
      headers: { Authorization: `Bearer ${alby.access_token}` },
    });

    let { lightning_address } = resolve.data;

    if (!lightning_address) {
      throw new Error("user not found");
    }

    const events = await collection.find({ lightning_address }).toArray();
    console.log(events);

    res.status(200).json({
      status: "success",
      events,
    });
  } catch (err) {
    if (err?.response?.data) {
      console.log("getEvents: " + err.response.data);
      console.log(err.response.data);
    } else {
      console.error("getEvents: " + err);
    }

    res.status(500).json({
      status: 500,
      error: "A server error occurred",
    });
  }
}
