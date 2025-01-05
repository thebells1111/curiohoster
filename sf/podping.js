import express from "express";
import dotenv from "dotenv";

if (!process.env.API_KEY) {
  dotenv.config();
}

const router = express.Router();
const { PODPING } = process.env;

router.get("/", async (req, res) => {
  try {
    const options = {
      method: "GET",
      headers: {
        Authorization: PODPING,
        "User-Agent": "Sovereign Feeds",
      },
    };

    const baseUrl = "https://podping.cloud/?url=";
    const feed = req.query.url;
    const reason = req.query.reason;
    const medium = req.query.medium;

    if (feed) {
      let url = baseUrl + encodeURIComponent(feed);
      if (reason) {
        url += `&reason=${encodeURIComponent(reason)}`;
      }
      if (medium) {
        url = url + `&reason=${medium}`;
      }

      const response = await fetch(url, options);
      const responseBody = await response.text();

      if (response.status === 404) {
        return res.status(404).send("Fail!");
      }

      res.status(response.status).send(responseBody);
    } else {
      res.status(500).send("No Podcast Selected");
    }
  } catch (err) {
    console.error("podping err: ", err);
    res.status(500).json({ message: err.message });
  }
});
const podpingRouter = router;

export default podpingRouter;
