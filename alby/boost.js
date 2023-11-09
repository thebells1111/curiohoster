import axios from "axios";
import jwt from "jsonwebtoken";

const { ALBY_JWT } = process.env;

const boost = async (req, res) => {
  try {
    const body = req.body;

    const cookies = req.cookies;

    let alby = cookies.awt ? jwt.verify(cookies.awt, ALBY_JWT) : undefined;

    if (alby && body) {
      let resolve = await axios({
        method: "POST",
        url: "https://api.getalby.com/payments/keysend/multi",
        headers: { Authorization: `Bearer ${alby.access_token}` },
        data: { keysends: body },
      }).catch((error) => {
        console.log("error: ", error.response.data);
        throw error; // Propagate error up to outer catch block
      });

      console.log(resolve.data.keysends);
      res.status(200).json(resolve.data.keysends);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.log("albyauth: " + err);
    res.status(500).json({ message: "Server Error" });
  }
};

export default boost;
