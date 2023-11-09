import axios from "axios";
import jwt from "jsonwebtoken";

const create = async (req, res) => {
  try {
    const cookies = req.cookies;

    let alby = cookies.awt
      ? jwt.verify(cookies.awt, process.env.ALBY_JWT)
      : undefined;

    if (alby) {
      let resolve = await axios({
        method: "POST",
        url: "https://api.getalby.com/webhook_endpoints",
        headers: { Authorization: `Bearer ${alby.access_token}` },
        data: {
          url: "https://curiohoster/api/alby/webhook/settle",
          filter_types: ["invoice.incoming.settled"],
        },
      }).catch((error) => {
        console.log("error: ", error.response.data);
        res.status(500).json({ message: error.response.data });
      });

      if (!resolve) {
        return;
      }

      console.log(resolve.data);

      res.status(200).json(resolve.data);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.log("albyauth: " + err);
    res.status(500).json({ message: "Server Error" });
  }
};

export default create;
