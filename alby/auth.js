import axios from "axios";
import jwt from "jsonwebtoken";
import FormData from "form-data";
import crypto from "crypto";

const auth = async (req, res, next) => {
  try {
    let code = req.query.code;
    let redirect_uri = req.query.redirect_uri;

    if (code) {
      var formData = new FormData();
      formData.append("code", code);
      formData.append("redirect_uri", redirect_uri || req.REDIRECT_ROUTE);
      formData.append("grant_type", "authorization_code");

      let resolve = await axios({
        method: "POST",
        url: "https://api.getalby.com/oauth/token",
        auth: {
          username: req.ALBY_USERNAME,
          password: req.ALBY_PASSWORD,
        },
        data: formData,
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
        },
      }).catch((error) => {
        console.log("error: ", error.response.data);
        throw error; // Propagate error up to outer catch block
      });

      if (!resolve) {
        return;
      }

      const newToken = jwt.sign(resolve.data, process.env.ALBY_JWT, {
        expiresIn: "10d",
      });

      const [account, balance] = await Promise.all([
        axios({
          url: "https://api.getalby.com/user/value4value",
          headers: { Authorization: `Bearer ${resolve.data.access_token}` },
        }).catch((error) => {
          console.log("error: ", error.response.data);
          throw error; // Propagate error up to outer catch block
        }),

        axios({
          url: "https://api.getalby.com/balance",
          headers: { Authorization: `Bearer ${resolve.data.access_token}` },
        }).catch((error) => {
          console.log("error: ", error.response.data);
          throw error; // Propagate error up to outer catch block
        }),
      ]);

      if (!account || !balance) {
        return;
      }

      let tempCode = crypto.randomBytes(16).toString("hex");
      let user = { ...account.data, ...balance.data, tempCode };
      try {
        req.tempTokens[tempCode] = newToken;
        setTimeout(() => {
          delete req.tempTokens[tempCode];
        }, 60000);
      } catch (error) {}

      res.cookie("awt", newToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: process.env.NODE_ENV !== "development",
      });

      res.status(200).json(user);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.log("albyauth: " + err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export default auth;
