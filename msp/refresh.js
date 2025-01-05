import { getCollection } from "./database/_db/connect.js";
import setmspJWT from "./functions/setJWT.js";
import getEmailAddress from "./functions/getEmailAddress.js";

export default async function (req, res, next) {
  const collection = await getCollection("msp-users");
  let email = await getEmailAddress(req);

  if (!email) {
    res.cookie("msp", "", {
      expires: new Date(0), // Use expires to reliably delete the cookie
      httpOnly: true,
      path: "/", // Match root path to cover all paths
      sameSite:
        process?.env?.NODE_ENV?.trim() !== "development" ? "none" : "lax",
      secure: process?.env?.NODE_ENV?.trim() !== "development",
    });
    res.status(401).json({ status: 401, error: "Token not found" });
    return;
  }

  await setmspJWT(res, email);

  let user = await collection.findOne({ email });

  if (user?.settings?.bunny?.password) {
    user.settings.bunny.password = "********";
  }

  if (user?.settings?.bunny?.apiKey) {
    user.settings.bunny.apiKey = "********";
  }

  res.status(200).json({
    status: "success",
    settings: user.settings,
  });
}
