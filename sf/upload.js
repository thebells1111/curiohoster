import { S3 } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { decrypt } from "../functions/ciphers.js";
import { getCollection } from "./database/_db/connect.js";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const { JWT } = process.env;

export default async function upload(req, res, next, sockets) {
  let user;
  let email;
  let title;
  if (req.query.podcast) {
    title = req.query.podcast.split(".").join("ENCODE_DOT");
  }

  const cookies = req.cookies;
  let token = cookies.ss;

  console.log("title: ", title);
  console.log("token: ", token);

  const collection = await getCollection("users");

  if (token) {
    let decode = jwt.verify(token, JWT);
    email = decode.email;

    user = await collection.find({ email: decode.email }).toArray();
    user = user[0];
    if (!user) {
      user = { email: email, validatedFeeds: [] };

      // Select the users collection from the database
      const result = await collection.insertOne(user);
    }
  }

  console.log(user.email);
  const DO_BUCKET =
    user[title].DO_BUCKET && (await decrypt(user[title].DO_BUCKET));

  const DO_ENDPOINT =
    user[title].DO_ENDPOINT && (await decrypt(user[title].DO_ENDPOINT));

  const DO_ACCESS_KEY =
    user[title].DO_ACCESS_KEY && (await decrypt(user[title].DO_ACCESS_KEY));

  const DO_SECRET_KEY =
    user[title].DO_SECRET_KEY && (await decrypt(user[title].DO_SECRET_KEY));

  const s3Client = new S3({
    region: "us-east-1",
    endpoint: "https://" + DO_ENDPOINT,
    credentials: {
      accessKeyId: DO_ACCESS_KEY,
      secretAccessKey: DO_SECRET_KEY,
    },
  });
  let folder = req.query.folder
    .split("/")
    .map((v) => v.replace(/\s/g, "_").replace(/[\W]+/g, ""))
    .join("/");

  console.log("folder: ", folder);

  const uploadFile = uploadXML(s3Client, DO_BUCKET, DO_ENDPOINT, folder);
  const uploadArchiveFile = uploadArchive(
    s3Client,
    DO_BUCKET,
    DO_ENDPOINT,
    folder
  );

  uploadArchiveFile(req, res, function (error, data) {
    if (error) {
      console.log(error);
    }
    console.log("Archive uploaded successfully.");
  });

  uploadFile(req, res, function (error, data) {
    if (error) {
      console.log(error);
      res.send("error");
    }
    console.log(req.fileUrl);
    console.log("File uploaded successfully.");
    res.send(req.fileUrl);
  });
}

function uploadXML(s3Client, DO_BUCKET, DO_ENDPOINT, folder) {
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: DO_BUCKET,
      acl: "public-read",
      contentType: function (req, file, cb) {
        console.log(file);
        let type = file.mimetype;
        if (file.mimetype === "text/xml") {
          type = "application/xml";
        }
        cb(null, type);
      },
      key: function (req, file, cb) {
        let s = file.originalname.split(".");
        let ext = s.pop();
        let fileName = s.join(".").replace(/[\W]+/g, "") + "." + ext;
        let fileFolder = folder ? folder + "/" + fileName : fileName;

        let origin =
          "https://" + DO_BUCKET + "." + DO_ENDPOINT + "/" + fileFolder;
        let temp1 = origin.split("https://" + DO_BUCKET)[1].split(".");
        temp1.splice(2, 0, "cdn");
        let cdn = "https://" + DO_BUCKET + temp1.join(".");

        let location = { origin: origin, cdn: cdn };

        req.fileUrl = location;

        cb(null, fileFolder);
      },
    }),
  }).array("file", 1);
}

function uploadArchive(s3Client, DO_BUCKET, DO_ENDPOINT, folder) {
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: DO_BUCKET,
      acl: "public-read",
      contentType: function (req, file, cb) {
        console.log(file);
        let type = file.mimetype;
        if (file.mimetype === "text/xml") {
          type = "application/xml";
        }
        cb(null, type);
      },
      key: function (req, file, cb) {
        let s = file.originalname.split(".");
        let ext = s.pop();
        let fileName =
          s.join(".").replace(/[\W]+/g, "") +
          "_" +
          new Date().getTime() +
          "." +
          ext;
        let fileFolder = folder ? folder + "/archive/" + fileName : fileName;

        let origin =
          "https://" + DO_BUCKET + "." + DO_ENDPOINT + "/" + fileFolder;
        let temp1 = origin.split("https://" + DO_BUCKET)[1].split(".");
        temp1.splice(2, 0, "cdn");
        let cdn = "https://" + DO_BUCKET + temp1.join(".");

        let location = { origin: origin, cdn: cdn };

        cb(null, fileFolder);
      },
    }),
  }).array("file", 1);
}
