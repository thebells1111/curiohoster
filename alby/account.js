import axios from "axios";
import jwt from "jsonwebtoken";

const account = async (req, res) => {
  try {
    const cookies = req.cookies;

    let alby = cookies.awt
      ? jwt.verify(cookies.awt, process.env.ALBY_JWT)
      : undefined;

    if (alby) {
      let resolve;
      try {
        resolve = await axios({
          url: "https://api.getalby.com/user/value4value",
          headers: { Authorization: `Bearer ${alby.access_token}` },
        });
      } catch (error) {
        console.log("error: ", error.response.data);
        return res.status(500).json({ message: error.response.data });
      }

      if (!resolve) {
        return;
      }

      res.status(200).json(resolve.data);
    }
  } catch (err) {
    console.log("error: " + err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export default account;
