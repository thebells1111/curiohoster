import { getCollection } from "./database/_db/connect.js";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const { JWT } = process.env;

export async function saveChaptersPost(req, res) {
  try {
    const body = typeof req.body === "object" ? req.body : JSON.parse(req.body);
    let chapterLink = body.chapterLink;
    let chapterContent = body.chapterContent;

    let decode;

    console.log(chapterLink);

    const cookies = req.cookies;
    let token = cookies.ss;

    if (token) {
      const collection = await getCollection("chapters");
      decode = jwt.verify(token, JWT);

      await collection.updateOne(
        {
          link: chapterLink,
        },
        {
          $set: {
            [`${decode.email.split(".").join("%20")}`]: chapterContent,
          },
        },
        { upsert: true }
      );

      res.status(200).json({
        status: "success",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(200).json({
      status: "fail",
      memo: "user not found",
    });
  }
}

export async function saveChaptersGet(req, res) {
  try {
    let chapterLink = req.query.link;
    const cookies = req.cookies;
    let token = cookies.ss;

    if (token && chapterLink) {
      const collection = await getCollection("chapters");
      let decode = jwt.verify(token, JWT);
      let encodedEmail = `${decode.email.split(".").join("%20")}`;

      let chapters = await collection
        .aggregate([
          { $match: { [encodedEmail]: { $exists: true }, link: chapterLink } },
          { $project: { [encodedEmail]: 1, _id: 0 } },
        ])
        .toArray();
      chapters = chapters[0];
      console.log(chapters);

      res.status(200).json({
        status: "success",
        chapters: chapters?.[encodedEmail] || [],
      });
    }
  } catch (error) {
    console.log(error);
    res.status(200).json({
      status: "fail",
      memo: "user not found",
    });
  }
}
