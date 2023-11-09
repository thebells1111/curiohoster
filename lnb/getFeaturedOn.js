import { getCollection } from "./database/_db/connect.js";

export default async function getFeatured(req, res, next) {
  try {
    // Get the 'featuredOn' collection
    const collection = await getCollection("featuredOn");

    // Destructure query parameters
    const { remoteFeedGuid, remoteItemGuid } = req.query;

    // Validate incoming data (you may add more comprehensive checks)
    if (!remoteFeedGuid || !remoteItemGuid) {
      res.status(400).json({
        status: 400,
        error: "Missing required query parameters",
      });
      return;
    }

    // Find matching documents and project only title and podcastGuid
    const documents = await collection
      .find(
        { remoteFeedGuid, remoteItemGuid },
        { projection: { _id: 0, title: 1, podcastGuid: 1 } }
      )
      .toArray();

    // Send response
    res.status(200).json({
      status: "success",
      data: documents,
    });
  } catch (err) {
    console.error("getFeatured: " + err);
    res.status(500).json({
      status: 500,
      error: err.message,
    });
  }
}
