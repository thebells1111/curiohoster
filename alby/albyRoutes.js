import express from "express";
import auth from "./auth.js";
import refresh from "./refresh.js";
import refreshauth from "./refreshauth.js";
import boost from "./boost.js";
// import webhookGet from "./webhook/get.js";
import webhookCreate from "./webhook/create.js";
import webhookSettle from "./webhook/settle.js";
import logout from "./logout.js";
import getToken from "./gettoken.js";
import handlePayments from "./handlePayments.js";
import payInvoice from "./payInvoice.js";

import bodyParser from "body-parser";

import fs from "fs";

const router = express.Router();

const albyRoutes = (tempTokens) => {
  router.use((req, res, next) => {
    req.tempTokens = tempTokens;
    next();
  });

  router.get("/auth", auth);
  router.get("/refresh", refresh);
  router.post("/refreshauth", bodyParser.json(), refreshauth);
  router.get("/account", refresh);
  router.post("/boost", bodyParser.json(), boost);
  router.post("/handlePayments", bodyParser.json(), handlePayments);
  router.post("/pay-invoice", bodyParser.json(), payInvoice);
  // router.get("/webhook", webhookGet);
  router.get("/webhook/create", webhookCreate);
  router.get("/logout", logout);
  router.get("/webhook/settle", async (req, res) => {
    res.status(200).send("settle route");
  });
  router.get("/gettoken", getToken);

  router.post(
    "/webhook/settle",
    bodyParser.raw({ type: "application/json" }),
    (req, res) => {
      const payload = req.body;
      const headers = req.headers;
      let boostagram = payload.boostagram;
      if (boostagram.podcast === "Boostagram Ball") {
        console.log(boostagram);

        let filename;

        if (boostagram.action === "boost") {
          filename = "boost.json";
        } else if (boostagram.action === "stream") {
          filename = "stream.json";
        }

        if (filename) {
          fs.appendFile(filename, JSON.stringify(boostagram) + "\n", (err) => {
            if (err) throw err;
            console.log(`Appended to ${filename}`);
          });
        }
      }

      res.json({});
    }
  );

  return router;
};

export default albyRoutes;
