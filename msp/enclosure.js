import axios from "axios";

export default async function (req, res, next) {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: "URL query parameter is required" });
    return;
  }

  try {
    // Try HEAD request first
    let response = await axios.head(url);
    let length = response.headers["content-length"];
    let mimeType = response.headers["content-type"];

    if (!length || !mimeType) {
      // Fallback to Range request if HEAD does not return length or type
      response = await axios.get(url, { headers: { Range: "bytes=0-0" } });
      length = response.headers["content-range"]
        ? response.headers["content-range"].split("/")[1]
        : response.headers["content-length"];
      mimeType = response.headers["content-type"];
    }

    res.json({ length, mimeType });
  } catch (error) {
    next(new Error("Failed to retrieve enclosure info"));
  }
}
