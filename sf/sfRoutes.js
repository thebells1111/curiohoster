import express from "express";
import verifyUser from "./verify-token.js";
import signout from "./signout.js";
import upload from "./upload.js";
import serverpush from "./serverpush.js";
import generateguid from "./generateguid.js";
import { webhookPost, webhookGet } from "./webhook.js";
import { saveChaptersPost, saveChaptersGet } from "./savechapters.js";

const router = express.Router();

router.get("/verify-token", (req, res, next) => {
  verifyUser(req, res, next);
});

router.get("/signout", (req, res, next) => {
  signout(req, res, next);
});

router.get("/webhook", (req, res, next) => {
  console.log("webhook get");
  webhookGet(req, res, next);
});

router.post("/webhook", (req, res, next) => {
  webhookPost(req, res, next);
});

router.post("/upload", function (req, res, next) {
  upload(req, res, next);
});

router.post("/serverpush", function (req, res, next) {
  serverpush(req, res, next);
});

router.get("/generateguid", function (req, res, next) {
  generateguid(req, res, next);
});

router.post("/savechapters", async (req, res, next) => {
  saveChaptersPost(req, res);
});

router.get("/savechapters", async (req, res, next) => {
  saveChaptersGet(req, res);
});

export default router;
