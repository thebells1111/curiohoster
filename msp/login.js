import bodyParser from "body-parser";
import { getCollection } from "./database/_db/connect.js";
import bcrypt from "bcrypt";
import setJWT from "./functions/setJWT.js";

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const collection = await getCollection("msp-users");
    let user = await collection.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    // Initialize loginAttempts, isLocked, and lockTimestamp if they don't exist
    if (
      user.loginAttempts === undefined ||
      user.isLocked === undefined ||
      user.lockTimestamp === undefined
    ) {
      await collection.updateOne(
        { email },
        { $set: { loginAttempts: 0, isLocked: false, lockTimestamp: null } }
      );
      user = await collection.findOne({ email });
    }

    const currentTime = new Date();
    const lockDuration = 15 * 60 * 1000; // 15 minutes in milliseconds

    // Check if account is locked and if lockout period has passed
    if (user.isLocked) {
      const lockTime = user.lockTimestamp
        ? new Date(user.lockTimestamp)
        : new Date(0);
      if (currentTime - lockTime > lockDuration) {
        // Unlock the account and reset the attempt counter
        await collection.updateOne(
          { email },
          { $set: { loginAttempts: 0, isLocked: false, lockTimestamp: null } }
        );
      } else {
        return res
          .status(403)
          .json({ status: "error", message: "Account is temporarily locked" });
      }
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const newAttempts = user.loginAttempts + 1;
      const isNowLocked = newAttempts >= 5;
      const lockTimestamp = isNowLocked ? new Date() : null;

      await collection.updateOne(
        { email },
        {
          $set: {
            loginAttempts: newAttempts,
            isLocked: isNowLocked,
            lockTimestamp: lockTimestamp,
          },
        }
      );

      if (isNowLocked) {
        return res.status(403).json({
          status: "error",
          message: "Account is locked due to multiple failed attempts",
        });
      }

      return res
        .status(401)
        .json({ status: "error", message: "Invalid email and/or password" });
    }

    await collection.updateOne(
      { email },
      { $set: { loginAttempts: 0, isLocked: false, lockTimestamp: null } }
    );

    await setJWT(res, user.email);

    if (user?.settings?.bunny?.password) {
      user.settings.bunny.password = "********";
    }

    if (user?.settings?.bunny?.apiKey) {
      user.settings.bunny.apiKey = "********";
    }

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      settings: user.settings,
    });
  } catch (err) {
    console.error("login: " + err.message);
    res.status(500).json({ status: "error", error: err.message });
  }
};

export const middleware = [bodyParser.raw({ type: "application/json" }), login];
export default login;
