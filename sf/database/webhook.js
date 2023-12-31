import { decrypt, encrypt } from "../functions/ciphers.js";
import { getCollection } from "./_db/connect.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import bodyParser from "body-parser";

dotenv.config();

const { JWT } = process.env;

export const post = async (req, res, next) => {
  try {
    const body = req.body;
    let webhookLink = body.webhookLink;
    let webhookSecret = body.webhookSecret;
    let chapterLink = body.chapterLink;
    let chapterSecret = body.chapterSecret;
    let DO_BUCKET = body.DO_BUCKET;
    let DO_ENDPOINT = body.DO_ENDPOINT;
    let DO_ACCESS_KEY = body.DO_ACCESS_KEY;
    let DO_SECRET_KEY = body.DO_SECRET_KEY;
    let DO_ENABLED = body.DO_ENABLED;

    webhookLink = await encrypt(webhookLink);
    webhookSecret = await encrypt(webhookSecret);
    chapterLink = await encrypt(chapterLink);
    chapterSecret = await encrypt(chapterSecret);
    DO_BUCKET = await encrypt(DO_BUCKET);
    DO_ENDPOINT = await encrypt(DO_ENDPOINT);
    DO_ACCESS_KEY = await encrypt(DO_ACCESS_KEY);
    DO_SECRET_KEY = await encrypt(DO_SECRET_KEY);

    let title = body.title.split(".").join("ENCODE_DOT");
    let decode;

    const cookies = req.cookies;
    let token = cookies.ss;

    if (token && title) {
      const collection = await getCollection("users");
      decode = jwt.verify(token, JWT);
      let update = {
        webhookLink: webhookLink,
        webhookSecret: webhookSecret,
        chapterLink: chapterLink,
        chapterSecret: chapterSecret,
        DO_BUCKET: DO_BUCKET,
        DO_ENDPOINT: DO_ENDPOINT,
        DO_ACCESS_KEY: DO_ACCESS_KEY,
        DO_SECRET_KEY: DO_SECRET_KEY,
        DO_ENABLED: DO_ENABLED,
      };

      //removes undefined object keys
      Object.keys(update).forEach(
        (key) => update[key] === undefined && delete update[key]
      );

      await collection.updateOne(
        {
          email: decode.email,
        },
        {
          $set: {
            [`${title}`]: update,
          },
        },
        { upsert: true }
      );

      const newToken = jwt.sign(
        {
          email: decode.email,
          walletId: decode.walletId,
          // webhookLink: webhookLink,
          // webhookSecret: webhookSecret
        },
        JWT,
        {
          expiresIn: "10d",
        }
      );

      return {
        status: 200,
        headers: {
          "set-cookie": [
            `ss=${newToken}; Max-Age=${
              10 * 24 * 60 * 60
            }; httpOnly; path=/; sameSite=none;  ${
              process.env.NODE_ENV === "development" ? "" : "secure"
            }`,
          ],
        },
        body: {
          status: "success",
          user: {
            webhookLink: webhookLink,
            webhookSecret: webhookSecret,
          },
        },
      };
    }
  } catch (error) {
    console.log(error);
    return {
      status: 200,
      // headers: {
      // 	'set-cookie': [
      // 		`ss=""; Max-Age=0; httpOnly; path=/; sameSite=none;  ${
      // 			process.env.NODE_ENV === 'development' ? '' : 'secure'
      // 		}`
      // 	]
      // },
      body: {
        status: "fail",
        memo: "user not found",
      },
    };
  }
};

export const getWebhooks = async (req, res, next) => {
  try {
    let title = req.query.title.split(".").join("ENCODE_DOT");
    const cookies = req.cookies;
    let token = cookies.ss;
    console.log("token: ", token);

    if (token && title) {
      const collection = await getSFCollection("users");
      let decode = jwt.verify(token, JWT);

      user = await collection.find({ email: decode.email }).toArray();
      user = user[0];

      user[title].webhookSecret =
        user[title].webhookSecret && (await decrypt(user[title].webhookSecret));
      user[title].webhookLink =
        user[title].webhookLink && (await decrypt(user[title].webhookLink));

      user[title].chapterSecret =
        user[title].chapterSecret && (await decrypt(user[title].chapterSecret));
      user[title].chapterLink =
        user[title].chapterLink && (await decrypt(user[title].chapterLink));

      user[title].DO_BUCKET =
        user[title].DO_BUCKET && (await decrypt(user[title].DO_BUCKET));

      user[title].DO_ENDPOINT =
        user[title].DO_ENDPOINT && (await decrypt(user[title].DO_ENDPOINT));

      user[title].DO_ACCESS_KEY =
        user[title].DO_ACCESS_KEY && (await decrypt(user[title].DO_ACCESS_KEY));

      user[title].DO_SECRET_KEY =
        user[title].DO_SECRET_KEY && (await decrypt(user[title].DO_SECRET_KEY));
      return {
        status: 200,
        body: {
          status: "success",
          webhooks: user[title],
        },
      };
    }
  } catch (error) {
    console.log(error);
    res.status(200).json({
      status: "fail",
      memo: "user not found",
    });
  }
};
