import { getCollection } from "./database/_db/connect.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { decrypt } from "../functions/ciphers.js";
import fetch from "node-fetch";
dotenv.config();

const { JWT } = process.env;

const parseRequestBody = (body) => {
  return typeof body === "object" ? body : JSON.parse(body);
};

const fetchUserFromToken = async (token) => {
  const collection = await getCollection("users");
  const decode = jwt.verify(token, JWT);
  const users = await collection.find({ email: decode.email }).toArray();
  return users[0];
};

const getFeedTitle = (user, title) =>
  user?.[title.split(".").join("ENCODE_DOT")];

const getLinkAndSecret = async (feedTitle, xml, chapters) => {
  let link;
  let secret;

  if (xml) {
    link = await decrypt(feedTitle?.webhookLink);
    secret = await decrypt(feedTitle?.webhookSecret);
  } else if (chapters) {
    link = await decrypt(feedTitle?.chapterLink);
    secret = await decrypt(feedTitle?.chapterSecret);
  }

  return { link, secret };
};

export default async function serverpush(req, res, next) {
  try {
    const body = parseRequestBody(req.body);
    const { xml, chapters, title } = body;

    const cookies = req.cookies;
    const token = cookies.ss;

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "No authentication token provided",
      });
    }

    const user = await fetchUserFromToken(token);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User Not Found. Please Log In.",
      });
    }

    if (!title) {
      return res.status(400).json({
        status: "fail",
        message: "Please Select a Feed",
      });
    }

    const feedTitle = getFeedTitle(user, title);
    const { link, secret } = await getLinkAndSecret(feedTitle, xml, chapters);

    if (!link) {
      return res.status(400).json({
        status: "fail",
        message: "No Sever Link Provided",
      });
    }

    const serverData = { xml, chapters };

    const response = await fetch(link, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        credentials: "omit",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(serverData),
    });

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
}
