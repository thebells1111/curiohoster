import { parse } from "fast-xml-parser";
import { decode } from "html-entities";

export const get = async (req, res) => {
  try {
    let url = req.query.url;
    const response = await fetch(url, {
      "User-Agent": "CurioHoster",
    });
    const feed = (await response.text()) || {};

    const parserOptions = {
      attributeNamePrefix: "@_",
      //attrNodeName: false,
      //textNodeName : "#text",
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attrValueProcessor: (val, attrName) => decode(val), //default is a=>a
      tagValueProcessor: (val, tagName) => decode(val), //default is a=>a
    };

    xmlJson = parse(feed, parserOptions);

    let liveItem = [].concat(xmlJson?.rss?.channel?.["podcast:liveItem"]);
    let item = [].concat(xmlJson?.rss?.channel?.item);

    let live = liveItem
      .filter((v) => v && v["@_status"].toLowerCase() === "live")
      .map((v) => {
        return {
          description: v.description || "",
          enclosureType: v.enclosure["@_type"],
          enclosureUrl: v.enclosure["@_url"],
          explicit: null,
          guid: v.guid,
          image: v?.["itunes:image"]?.["@_href"],
          title: v.title,
          persons: null,
          value: parseValue(v["podcast:value"]),
          liveStatus: v["@_status"].toLowerCase(),
          chat: v["@_chat"],
          startTime: v["@_start"],
        };
      });

    let pending = liveItem
      .filter((v) => v && v["@_status"].toLowerCase() === "pending")
      .map((v) => {
        return {
          description: v.description || "",
          enclosureType: v.enclosure["@_type"],
          enclosureUrl: v.enclosure["@_url"],
          explicit: null,
          guid: v.guid,
          image: v.image,
          title: v.title,
          persons: null,
          value:
            parseValue(v["podcast:value"]) ||
            parseValue(feed?.rss?.channel?.["podcast:value"]),
          liveStatus: v["@_status"].toLowerCase(),
          chat: v["@_chat"],
          startTime: v["@_start"],
        };
      });

    res.status(200).json({ live: live, pending: pending, item: item });
  } catch (err) {
    console.log("getepisodes.js Error:", err);
    res.status(500).json([]);
  }
};

function parseValue(v) {
  if (v) {
    let value = {
      model: {
        method: v["@_method"],
        suggested: v["@_suggested"],
        type: v["@_type"],
      },
    };
    let destinations = v["podcast:valueRecipient"].map((w) => {
      return {
        address: w["@_address"],
        customKey: w["@_customKey"],
        customValue: w["@_customValue"],
        name: w["@_name"],
        split: w["@_split"],
        type: w["@_type"],
      };
    });

    value.destinations = destinations;
    return value;
  }
  return undefined;
}
