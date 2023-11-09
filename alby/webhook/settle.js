import { Webhook } from "svix";
import bodyParser from "body-parser";
import dotenv from "dotenv";

if (!process.env.API_KEY) {
  dotenv.config();
}

const { WEBHOOK_SECRET } = process.env;

const settleMiddleware = (req, res) => {
  const payload = req.body;
  const headers = req.headers;

  const wh = new Webhook(WEBHOOK_SECRET);
  let msg;
  try {
    msg = wh.verify(payload, headers);
  } catch (err) {
    console.log(err);
    return res.status(400).json({});
  }

  // Do something with the message...
  console.log(msg);

  res.json({});
};

export default [bodyParser.raw({ type: "application/json" }), settleMiddleware];

let invoice = {
  action: "boost",
  app_name: "CurioCaster",
  episode: "Boostagram Ball - Episode 02",
  feedID: 6524027,
  itemID: 15572762356,
  message: "Testing Boost",
  name: "Sovereign Feeds",
  podcast: "Boostagram Ball",
  remote_feed_guid: "b8b6971e-403e-568f-a4e6-7aa2b45e50d4",
  remote_item_guid: "72a3b402-8491-4cd9-823e-a621fd81b86f",
  reply_address:
    "030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3",
  reply_custom_key: "696969",
  reply_custom_value: "eChoVKtO1KujpAA5HCoB",
  sender_name: "Steven₿",
  ts: 2231,
  url: "https://mp3s.nashownotes.com/bballrss.xml",
  value_msat: 5000,
  value_msat_total: 100000,
};
