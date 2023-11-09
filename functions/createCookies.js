export default function createCookie(name, value, maxAge) {
  return `${name}=${value}; Max-Age=${maxAge}; httpOnly; path=/; sameSite=none;  ${
    process.env.NODE_ENV === "development" ? "" : "secure"
  }`;
}
