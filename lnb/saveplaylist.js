import bodyParser from "body-parser";
import { getCollection } from "./database/_db/connect.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const { ALBY_JWT } = process.env;

const saveplaylist = async (req, res, next) => {
  try {
    const collection = await getCollection("playlist");
    const cookies = req.cookies;
    const token = cookies.awt;
    const { master, name, playlist } = req.body;
    console.log(JSON.stringify(req.body));

    console.log(master);
    console.log(name);
    console.log(playlist);

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
    console.log(lightning_address);

    if (!lightning_address) {
      res.status(404).json({
        status: 404,
        error: "User not found",
      });
      return;
    }

    let updateQuery = { $set: {} };

    if (master) {
      updateQuery.$set.master = master;
    }

    if (name) {
      updateQuery.$set[`playlists.${name}`] = playlist || [];
    }

    if (!Object.keys(updateQuery.$set).length) {
      res.status(400).json({
        status: 400,
        error: "No valid fields supplied for update",
      });
      return;
    }

    await collection.updateOne({ lightning_address }, updateQuery, {
      upsert: true,
    });

    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    console.error("saveplaylist: " + err);

    res.status(500).json({
      status: 500,
      error: err.message,
    });
  }
};

export const middleware = [
  bodyParser.raw({ type: "application/json" }),
  saveplaylist,
];
export default saveplaylist;
