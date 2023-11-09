import dotenv from "dotenv";
dotenv.config();

const createCookie = (name, value, maxAge) =>
  `${name}=${value}; Max-Age=${maxAge}; httpOnly; path=/; sameSite=none;  ${
    process.env.NODE_ENV === "development" ? "" : "secure"
  }`;

export default async function signout(req, res, next) {
  res.setHeader("set-cookie", [createCookie("ss", "", 0)]);
  res.status(200).json({
    status: "success",
    memo: "signed out",
  });
}
