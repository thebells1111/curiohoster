import { getCollection } from "./database/_db/connect.js";

export default async function saveFeaturedOn(req, res, next) {
  try {
    // Get the 'featuredOn' collection
    const collection = await getCollection("featuredOn");

    // Get the array from the request body
    const dataArray = req.body;

    // Validate the array
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      res.status(400).json({
        status: 400,
        error: "Invalid or empty array",
      });
      return;
    }

    // Prepare bulk operations
    const bulkOps = dataArray.map((doc) => ({
      updateOne: {
        filter: {
          title: doc.title,
          podcastGuid: doc.podcastGuid,
          remoteFeedGuid: doc.remoteFeedGuid,
          remoteItemGuid: doc.remoteItemGuid,
        },
        update: { $set: doc },
        upsert: true,
      },
    }));

    // Execute bulk operations
    await collection.bulkWrite(bulkOps);

    // Send response
    res.status(200).json({
      status: "success",
      message: "Documents added or updated successfully",
    });
  } catch (err) {
    console.error("saveFeaturedOn: " + err);
    res.status(500).json({
      status: 500,
      error: err.message,
    });
  }
}
