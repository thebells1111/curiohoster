import parseOpml from "node-opml-parser";

async function parseopml(req, res, next) {
  try {
    const body = typeof req.body === "object" ? req.body : JSON.parse(req.body);
    let opml = body.opml;

    let resBody = await opmlPromise(opml);

    res.status(200).json(resBody);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
}

let opmlPromise = function (data) {
  return new Promise((resolve, reject) => {
    parseOpml(data, (err, items) => {
      if (err) reject(err);
      else resolve(items);
    });
  });
};

export default parseopml;
