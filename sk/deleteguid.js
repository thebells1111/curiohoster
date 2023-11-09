import { getCollection } from "./database/_db/connect.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const { ALBY_JWT } = process.env;

const deleteGuid = async (req, res, next) => {
  try {
    const collection = await getCollection("sharedValueLinks");
    const { guid } = req.query; // extract guid from query parameters
    const cookies = req.cookies;
    const token = cookies.sawt || cookies.awt;

    if (!guid || !token) {
      throw new Error("GUID or Token not provided");
    }

    const alby = jwt.verify(token, ALBY_JWT);
    const resolve = await axios({
      url: "https://api.getalby.com/user/value4value",
      headers: { Authorization: `Bearer ${alby.access_token}` },
    });

    const { lightning_address } = resolve.data;

    const document = await collection.findOne({ guid });

    // Check if document exists and lightning_address matches
    if (!document || document.lightning_address !== lightning_address) {
      res.status(404).json({
        status: "fail",
        message:
          "No document found with that GUID, or lightning_address does not match",
      });
      return;
    }

    const result = await collection.deleteOne({ guid });

    res.status(200).json({
      status: "success",
      message: "Document successfully deleted",
    });
  } catch (err) {
    if (err?.response?.data) {
      console.log("deleteGuid: " + err.response.data);
    } else {
      console.error("deleteGuid: " + err);
    }

    res.status(500).json({
      status: 500,
      error: "A server error occurred",
    });
  }
};

export default deleteGuid;
