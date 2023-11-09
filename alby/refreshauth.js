import basicAuth from "basic-auth";

const refreshauth = async (req, res, next) => {
  const EXPECTED_USERNAME = req.ALBY_USERNAME;
  const EXPECTED_PASSWORD = req.ALBY_PASSWORD;
  console.log(EXPECTED_PASSWORD);
  console.log(EXPECTED_USERNAME);
  try {
    const body = req.body;
    console.log(body);
    
    if (body.code) {
      const code = body.code;
      req.tempTokens[code] = body.data;
      setTimeout(() => {
        delete req.tempTokens[code];
      }, 60000);
    }

    res.status(200).json({ message: "Handled successfully" });
  } catch (err) {
    console.log("alby_refreshauth: " + err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export default refreshauth;
