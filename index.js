import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { Server } from "socket.io";
import fetch from "node-fetch";
import cookie from "cookie";
import { getCollection } from "./sf/database/_db/connect.js";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import NodeCache from "node-cache";
import basicAuth from "basic-auth";
const dbCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

import sfRoutes from "./sf/sfRoutes.js";
import skRoutes from "./sk/skRoutes.js";
import albyRoutes from "./alby/albyRoutes.js";
import lnbRoutes from "./lnb/lnbRoutes.js";

dotenv.config();

import queryindex from "./queryindex.js";
import parseopml from "./parseopml.js";
const app = express();
const server = createServer(app);

let allowedOrigins = [
  "https://sovereignfeeds.com",
  "https://curiocaster.com",
  "https://lnbeats.com",
  "https://www.thesplitkit.com",
  "https://musicsideproject.com",
  "https://stable.sovereignfeeds.com",
];

if (process.env.DEV) {
  allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3333",
    "http://localhost:5001",
    "http://localhost:5173",
  ];
}

const originSuffixes = {
  "http://localhost:3000": {
    suffix: "_LOCAL",
    redirect_route: "http://localhost:3000",
  },
  "https://curiocaster.com": {
    suffix: "_CC",
    redirect_route: "https://curiocaster.com",
  },
  "https://musicsideproject.com": {
    suffix: "_MSP",
    redirect_route: "https://musicsideproject.com",
  },
  "https://www.thesplitkit.com": {
    suffix: "_SK",
    redirect_route: "https://www.thesplitkit.com",
  },
  "https://lnbeats.com": {
    suffix: "_LB",
    redirect_route: "https://lnbeats.com",
  },
};

let tempTokens = {};

app.use((req, res, next) => {
  req.cookies = cookie.parse(req.headers.cookie || "");
  next();
});

app.use(function (req, res, next) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(function (req, res, next) {
  let origin = req.headers.origin;
  let originInfo;

  console.log(origin);

  if (origin) {
    originInfo = originSuffixes[origin];
  } else {
    const user = basicAuth(req);
    console.log(user);
    if (user) {
      let suffixes = ["_LOCAL", "_LB", "_SK", "_SF", "_MSP", "_CC"];
      const activeSuffix = suffixes.find(
        (suffix) =>
          user?.name === process.env[`ALBY_USERNAME${suffix}`] &&
          user?.pass === process.env[`ALBY_PASSWORD${suffix}`]
      );
      if (activeSuffix) {
        for (const [origin, info] of Object.entries(originSuffixes)) {
          if (info.suffix === activeSuffix) {
            originInfo = info;
            break;
          }
        }
      }
    }
  }

  if (originInfo) {
    req.ALBY_USERNAME = process.env["ALBY_USERNAME" + originInfo.suffix];
    req.ALBY_PASSWORD = process.env["ALBY_PASSWORD" + originInfo.suffix];
    req.REDIRECT_ROUTE = originInfo.redirect_route;
  }

  console.log(originInfo);
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
  })
);

app.use("/api/sf", sfRoutes);
app.use("/api/sk", skRoutes);
app.use("/api/alby", albyRoutes(tempTokens));
app.use("/api/lnb", lnbRoutes);

app.use("/api/queryindex", bodyParser.json(), (req, res, next) => {
  queryindex(req, res, next);
});

app.post("/api/parseopml", (req, res, next) => {
  parseopml(req, res, next);
});

app.post("/servertest", function (req, res, next) {
  const body = typeof req.body === "object" ? req.body : JSON.parse(req.body);
  console.log(body);
  res.json({ message: "Yo dude!" });
});

app.get("/api/proxy", async (req, res, next) => {
  // const origin = req.headers.origin;
  // console.log(origin);

  // if (!allowedOrigins.includes(origin)) {
  //   return res.status(403).send("Origin not allowed");
  // }

  try {
    let response = await fetch(req.query.url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    response.body.pipe(res);
  } catch (error) {
    console.error("proxy error: ", error);
    res.status(500).send("An error occurred while fetching the URL");
  }
});

app.get("/api/sk/nextblock", (req, res, next) => {
  const event_id = req.query.guid; // Extracting event_id from the query
  console.log(event_id);
  // Assume you have the next block data; replace with actual logic
  const nextBlockData = {
    /* data for the next block */
  };

  // Broadcast the next block to the clients with the specified event_id
  nextBlock(event_id, nextBlockData);

  res.status(200).send("Next block broadcasted");
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log("listening on *:" + port);
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // or an array of allowed origins
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let remoteItems = {};

io.of("/event").on("connection", (socket) => {
  const cookies = cookie.parse(socket.handshake.headers.cookie || "");
  const event_id = socket.handshake.query.event_id;
  socket.cookies = cookies;
  socket.event_id = event_id;
  const guid = socket.event_id;
  if (!remoteItems[guid]) {
    remoteItems[guid] = { valueBlock: {}, clients: new Set() };
  }

  remoteItems[guid].clients.add(socket.id);
  console.log(remoteItems);
  console.log(socket.id);

  broadcastMessage(guid, remoteItems[guid].valueBlock);

  socket.on("disconnect", () => {
    for (let valueGuid in remoteItems) {
      // console.log(socket.id + " disconnected");
      if (
        remoteItems.hasOwnProperty(valueGuid) &&
        remoteItems[valueGuid]?.clients
      ) {
        // if the valueGuid's Set has this socket.id
        if (remoteItems[valueGuid].clients.has(socket.id)) {
          // remove this socket.id from the Set
          remoteItems[valueGuid].clients.delete(socket.id);

          // if the Set is now empty, remove the valueGuid from the object
          if (remoteItems[valueGuid].clients.size === 0) {
            delete remoteItems[valueGuid];
          }

          if (remoteItems[valueGuid]?.host === socket.id) {
            remoteItems[valueGuid].value = {};
            broadcastMessage(valueGuid, {});
          }

          // a socket.id should only be in one valueGuid's Set, so we can break
          break;
        }
      }
    }
  });

  socket.on("playerPause", async (data) => {
    const { valueGuid } = data;

    console.log(data);

    // Try to get the document from the cache first
    let document = dbCache.get(valueGuid);

    if (!document) {
      const collection = await getCollection("sharedValueLinks");
      document = await collection.findOne({ guid: valueGuid });
      dbCache.set(valueGuid, document);
    }

    try {
      const { ss, awt } = cookies;
      let token;
      let JWT;
      if (awt) {
        token = awt;
        JWT = process.env.ALBY_JWT;
      } else if (ss) {
        token = ss;
        JWT = process.env.JWT;
      }

      const { email } = jwt.verify(token, JWT);
      console.log(email);

      if (document && document.email === email) {
        remoteItems[valueGuid].host = socket.id;
        const guid = valueGuid;

        if (remoteItems?.[guid]?.clients) {
          remoteItems[guid].clients.forEach((client) => {
            io.of("/event").to(client).emit("playerPause", "playerPause"); // use io.to(client).emit instead of client.emit
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("valueBlock", async (data) => {
    const { serverData, valueGuid } = data;

    console.log(data);

    // Try to get the document from the cache first
    let document = dbCache.get(valueGuid);

    if (!document) {
      const collection = await getCollection("sharedValueLinks");
      document = await collection.findOne({ guid: valueGuid });
      dbCache.set(valueGuid, document);
    }

    if (valueGuid === "b1ddabe6-cb0d-4906-a25e-c3bc4afb0ba9") {
      remoteItems[valueGuid].valueBlock = serverData;
      remoteItems[valueGuid].host = socket.id;
      broadcastMessage(valueGuid, serverData);
    } else {
      try {
        const { ss, awt } = cookies;
        let token;
        let JWT;
        if (awt) {
          token = awt;
          JWT = process.env.ALBY_JWT;
        } else if (ss) {
          token = ss;
          JWT = process.env.JWT;
        }

        const { email } = jwt.verify(token, JWT);

        if (document && document.email === email) {
          remoteItems[valueGuid].valueBlock = serverData;
          remoteItems[valueGuid].host = socket.id;

          console.log(serverData);
          broadcastMessage(valueGuid, serverData);
        }
      } catch (error) {
        console.log(error);
      }
    }
  });
});

function broadcastMessage(guid, message) {
  if (remoteItems?.[guid]?.clients) {
    remoteItems[guid].clients.forEach((client) => {
      io.of("/event").to(client).emit("remoteValue", message); // use io.to(client).emit instead of client.emit
    });
  }
}

function nextBlock(guid, message) {
  console.log("hi");
  console.log(guid);
  message = "hi from server";

  io.of("/event").to(guid).emit("nextBlock", message); // use io.to(client).emit instead of client.emit
}
