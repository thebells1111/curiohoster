import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
import fs from "fs";

if (!process.env.API_KEY) {
  dotenv.config();
}

const { API_KEY, API_SECRET } = process.env;

try {
  // ======== Hash them to get the Authorization token ========
  const apiHeaderTime = Math.floor(Date.now() / 1000);
  const sha1Hash = crypto.createHash("sha1");
  const data4Hash = API_KEY + API_SECRET + apiHeaderTime;
  sha1Hash.update(data4Hash);
  const hash4Header = sha1Hash.digest("hex");

  // ======== Send the request and collect/show the results ========
  const headers = {
    "X-Auth-Date": apiHeaderTime.toString(),
    "X-Auth-Key": API_KEY,
    Authorization: hash4Header,
    "User-Agent": "CurioHoster",
  };

  const baseUrl = "https://api.podcastindex.org/api/1.0/";
  const query = "podcasts/bymedium?medium=music&val=lightning&max=2000";
  const url = baseUrl + query;

  console.log(url); // Logging the URL for debugging
  const response = await axios.get(url, { headers: headers });

  if (response && response.data) {
    let songs = [];
    const data = response.data;

    let fetchedFeeds = data.feeds || data.feed || [];

    let feeds = fetchedFeeds.filter((v) => {
      let addFeed = true;
      if (
        //this removes 100% Retro Live Feed
        [5718023].find((w) => v.id === w) ||
        v.author === "Gabe Barrett"
      ) {
        addFeed = false;
      }

      return addFeed;
    });

    // console.log(feeds);
    for (let i = 0; i < feeds.length; i++) {
      let feed = feeds[i];
      const epQuery = `/episodes/bypodcastguid?guid=${feed.podcastGuid}`;
      const epUrl = baseUrl + epQuery;
      const epResponse = await axios.get(epUrl, { headers: headers });
      const epData = epResponse.data;

      let s = epData.items.map((v) => {
        let w = {};
        w.album = feed.title;
        w.albumArt = feed.image || feed.artwork;
        w.albumUpdateTime = feed.lastUpdateTime;
        w.artist = feed.author;
        w.podcastGuid = feed.podcastGuid;
        w.title = v.title;

        w.guid = v.guid;
        w.datePublished = v.datePublished;
        w.enclosureUrl = v.enclosureUrl;

        return w;
      });

      songs = songs.concat(s);
    }

    songs = songs.sort((a, b) => {
      if (a.datePublished < b.datePublished) return 1;
      if (a.datePublished > b.datePublished) return -1;
      return 0;
    });

    console.log(songs.length);
    fs.writeFileSync("feeds.json", JSON.stringify(songs, null, 2));
    console.log("done!!!");
  }
} catch (err) {
  console.error("queryindex err:", err.message);
  console.log(err);
}
