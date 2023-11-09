import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";

if (!process.env.API_KEY) {
  dotenv.config();
}

const { API_KEY, API_SECRET } = process.env;

async function queryindex(req, res, next) {
  let { data } = req.body;

  try {
    // ======== Hash them to get the Authorization token ========
    const apiHeaderTime = Math.floor(Date.now() / 1000);
    const sha1Hash = crypto.createHash("sha1");
    const data4Hash = API_KEY + API_SECRET + apiHeaderTime;
    sha1Hash.update(data4Hash);
    const hash4Header = sha1Hash.digest("hex");

    // ======== Construct Axios Request ========

    const headers = {
      "X-Auth-Date": apiHeaderTime.toString(),
      "X-Auth-Key": API_KEY,
      Authorization: hash4Header,
      "User-Agent": "CurioHoster",
    };

    if (data) {
      headers["Content-Type"] = "application/json";
    }

    const baseUrl = "https://api.podcastindex.org/api/1.0/";
    const q = req.query.q;
    const url = baseUrl + q;

    console.log(url); // Logging the URL for debugging

    // const response = await axios({
    //   method: data ? "POST" : "GET",
    //   url: url,
    //   headers: headers,
    //   data: data ? data : undefined,
    // });

    const response = await axios.get(url, { headers: headers });

    if (response && response.data) {
      if (data) {
        console.log(response.data);
      }
      console.log(response);
      console.log(response.data);
      res.status(response.status).json(response.data);
    } else {
      res.status(404).json([]);
    }
  } catch (err) {
    console.error("queryindex err:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
}

export default queryindex;
