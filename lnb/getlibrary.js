import { getCollection } from "./database/_db/connect.js";

export default async function getblocks(req, res, next) {
  try {
    const collection = await getCollection("libraries");
    const { guid } = req.query;

    console.log(guid);

    if (!guid) {
      res.status(400).json({
        status: 400,
        error: "GUID not provided",
      });
      return;
    }

    let q = { title, podcastGuid, remoteFeedGuid, remoteItemGuid };

    const document = await collection.findOne(
      { guid },
      { projection: { _id: 0, lightning_address: 0 } }
    );

    console.log(document);

    // if (!document) {
    //   res.status(404).json({
    //     status: 404,
    //     error: "No blocks found for the provided GUID",
    //   });
    //   return;
    // }

    res.status(200).json({
      status: "success",
      blocks: document?.blocks || [],
      settings: document?.settings || {},
    });
  } catch (err) {
    console.error("getblocks: " + err);

    res.status(500).json({
      status: 500,
      error: err.message,
    });
  }
}
