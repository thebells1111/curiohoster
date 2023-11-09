import { getCollection } from "./database/_db/connect.js";

export default async function getvts(req, res, next) {
  try {
    const collection = await getCollection("savedBlocks");
    const { guid } = req.query;

    if (!guid) {
      res.status(400).json({
        status: 400,
        error: "guid not provided",
      });
      return;
    }

    const document = await collection.findOne(
      { guid },
      { projection: { _id: 0, lightning_address: 0 } }
    );

    // if (!document) {
    //   res.status(404).json({
    //     status: 404,
    //     error: "No blocks found for the provided GUID",
    //   });
    //   return;
    // }

    let vts = await loadBlocks(document?.blocks);
    if (vts) {
      res.status(200).json({
        status: "success",
        vts,
      });
    }

    res.status(400).json({
      status: "fail",
      reason: "unable to build value time splits from that guid",
    });
  } catch (err) {
    console.error("getblocks: " + err);

    res.status(500).json({
      status: 500,
      error: err.message,
    });
  }
}

async function loadBlocks(docBlocks) {
  if (docBlocks?.length) {
    let xmlText = "";
    docBlocks.forEach((v) => {
      if (v.startTime && v.duration && v?.value?.destinations?.length) {
        xmlText += "<podcast:valueTimeSplit";
        if (v.startTime) {
          xmlText += `\n   startTime="${v.startTime}"\n   remotePercentage="${
            v?.settings?.split || 100
          }"`;
        }
        if (v.duration) {
          xmlText += `\n   duration="${v.duration}"`;
        }

        xmlText += "\n>";
        xmlText += "\n";

        if (v.feedGuid) {
          xmlText += `  <podcast:remoteItem \n    feedGuid="${v.feedGuid}"`;
          if (v.itemGuid) {
            xmlText += `\n    itemGuid="${v.itemGuid}"`;
          }

          xmlText += "\n  />\n";
        } else {
          xmlText += "  <podcast:valueRecipient";

          v.value.destinations.forEach((w) => {
            // <podcast:valueRecipient name="Alice (Podcaster)" type="node" address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52" split="85" />
            xmlText += "\n    ";
            xmlText += `type="node"`;
            if (w.name) {
              xmlText += "\n    ";
              xmlText += `name="${w.name}"`;
            }
            xmlText += "\n    ";
            xmlText += `address="${w.address}"`;
            if (w.customKey) {
              xmlText += "\n    ";
              xmlText += `customKey="${w.customKey}"`;
            }
            if (w.customValue) {
              xmlText += "\n    ";
              xmlText += `customValue="${w.customValue}"`;
            }

            xmlText += "\n    ";
            xmlText += `split="${w.split || 100}"`;
          });

          xmlText += "\n  />\n";
        }

        xmlText += "</podcast:valueTimeSplit>";
        xmlText += "\n";
      }
    });
    return xmlText;
  }
}
