import bodyParser from "body-parser";
import { getCollection } from "./database/_db/connect.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const { ALBY_JWT } = process.env;

const saveblocks = async (req, res, next) => {
  try {
    const collection = await getCollection("savedBlocks");
    const cookies = req.cookies;
    const token = cookies.sawt || cookies.awt;
    const { blocks, guid } = req.body;

    if (!token) {
      res.status(401).json({
        status: 401,
        error: "Token not found",
      });
      return;
    }

    const alby = jwt.verify(token, ALBY_JWT);

    const resolve = await axios({
      url: "https://api.getalby.com/user/value4value",
      headers: { Authorization: `Bearer ${alby.access_token}` },
    });

    const { lightning_address } = resolve.data;

    if (!lightning_address) {
      res.status(404).json({
        status: 404,
        error: "User not found",
      });
      return;
    }

    await collection.updateOne(
      { guid, lightning_address },
      { $set: { blocks } },
      { upsert: true }
    );

    res.status(200).json({
      status: "success",
      guid,
    });
  } catch (err) {
    console.error("saveblocks: " + err);

    res.status(500).json({
      status: 500,
      error: err.message,
    });
  }
};

export const middleware = [
  bodyParser.raw({ type: "application/json" }),
  saveblocks,
];
export default saveblocks;
