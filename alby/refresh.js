import axios from "axios";
import jwt from "jsonwebtoken";
import FormData from "form-data";

const refresh = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    console.log("cookies: ", cookies);
    let alby = cookies.awt
      ? jwt.verify(cookies.awt, process.env.ALBY_JWT)
      : undefined;

    if (alby) {
      var formData = new FormData();
      formData.append("refresh_token", alby.refresh_token);
      formData.append("grant_type", "refresh_token");

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
        console.log("oauth error: ", error.response.data);
        throw error; // Propagate error up to outer catch block
      });

      if (!resolve) {
        return;
      }

      const newToken = jwt.sign(resolve.data, process.env.ALBY_JWT, {
        expiresIn: "10d",
      });

      let accessToken = resolve.data.access_token;

      const [account, balance] = await Promise.all([
        axios({
          url: "https://api.getalby.com/user/value4value",
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch((error) => {
          console.log("error: ", error.response.data);
          throw error; // Propagate error up to outer catch block
        }),

        axios({
          url: "https://api.getalby.com/balance",
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch((error) => {
          console.log("error: ", error.response.data);
          throw error; // Propagate error up to outer catch block
        }),
      ]);

      if (!account || !balance) {
        return;
      }

      let user = { ...account.data, ...balance.data };

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

export default refresh;
