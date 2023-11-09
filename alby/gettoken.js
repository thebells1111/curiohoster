import jwt from "jsonwebtoken";

const getToken = async (req, res, next) => {
  let code = req.query.code;
  let token = req.tempTokens[code];
  delete req.tempTokens[code];

  try {
    const newToken = jwt.sign(token, process.env.ALBY_JWT, {
      expiresIn: "10d",
    });

    res.cookie("sawt", newToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: process.env.NODE_ENV !== "development",
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    res.cookie("sawt", "", {
      maxAge: 0,
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: process.env.NODE_ENV !== "development",
    });
    res.status(500).json({ success: false });
  }
};

export default getToken;
