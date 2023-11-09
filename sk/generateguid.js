import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import { getCollection } from "./database/_db/connect.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const { ALBY_JWT } = process.env;

const generateguid = async (req, res, next) => {
  try {
    const collection = await getCollection("sharedValueLinks");
    const cookies = req.cookies;
    const token = cookies.sawt || cookies.awt;
    const { eventName } = req.body;

    if (!token) {
      throw new Error("Token not found");
    }

    console.log("g-token: ", token);
    const alby = jwt.verify(token, ALBY_JWT);

    const resolve = await axios({
      url: "https://api.getalby.com/user/value4value",
      headers: { Authorization: `Bearer ${alby.access_token}` },
    });

    const { lightning_address } = resolve.data;
    console.log(lightning_address);

    if (!lightning_address) {
      throw new Error("user not found");
    }

    // Generate GUID and check if it exists in sharedValueLinks array
    let guid;
    let sharedValueLink;
    do {
      guid = uuidv4();
      sharedValueLink = await collection.findOne({ guid });
    } while (sharedValueLink);

    await collection.insertOne({ guid, lightning_address, eventName });

    res.status(200).json({
      status: "success",
      guid, // Return the newly generated GUID
    });
  } catch (err) {
    if (err?.response?.data) {
      console.log("generateGuid: " + err.response.data);
    } else {
      console.error("generateGuid: " + err);
    }

    res.status(500).json({
      status: 500,
      error: "A server error occurred",
    });
  }
};

export const middleware = [
  bodyParser.raw({ type: "application/json" }),
  generateguid,
];
export default generateguid;
