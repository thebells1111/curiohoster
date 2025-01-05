export default async function (req, res, next) {
  try {
    res.cookie("msp", "", {
      expires: new Date(0), // Use expires to reliably delete the cookie
      httpOnly: true,
      path: "/", // Match root path to cover all paths
      sameSite:
        process?.env?.NODE_ENV?.trim() !== "development" ? "none" : "lax",
      secure: process?.env?.NODE_ENV?.trim() !== "development",
    });
    res.sendStatus(204); // No Content
  } catch (error) {
    next(error); // Pass error to Express error handler
  }
}
