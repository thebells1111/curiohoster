import { getCollection } from "./database/_db/connect.js";

export default async function lookup(req, res, next) {
  try {
    const { eventGuid, blockGuid } = req.query;

    if (!eventGuid || !blockGuid) {
      res.status(400).json({
        status: 400,
        error: "Missing eventGuid and/or blockGuid in query parameters",
      });
      return;
    }

    const collection = await getCollection("savedBlocks");

    const document = await collection.findOne({
      "blocks.eventGuid": eventGuid,
      "blocks.blockGuid": blockGuid,
    });

    if (!document) {
      res.status(404).json({
        status: 404,
        error: "No block found matching the provided eventGuid and blockGuid",
      });
      return;
    }

    const matchingBlock = document.blocks.find(
      (block) => block.eventGuid === eventGuid && block.blockGuid === blockGuid
    );

    if (!matchingBlock) {
      res.status(404).json({
        status: 404,
        error: "No block found matching the provided eventGuid and blockGuid",
      });
      return;
    }

    delete matchingBlock.settings;

    res.status(200).json({
      status: 200,
      block: matchingBlock,
    });
  } catch (err) {
    console.error("getpromotion: " + err);

    res.status(500).json({
      status: 500,
      error: err.message,
    });
  }
}
