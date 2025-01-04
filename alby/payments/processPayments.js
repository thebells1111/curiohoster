import sendKeysend from "./sendKeysend.js";
import sendLNUrl from "./sendLNUrl.js";

export default async function processPayments(accessToken, splits) {
  let paymentAttempts = splits.map((recipient) => {
    if (recipient?.type === "node") {
      return sendKeysend({ accessToken, recipient });
    } else if (recipient?.type === "lnaddress") {
      return sendLNUrl({ accessToken, recipient });
    } else {
      return Promise.resolve({ status: "skipped", recipient });
    }
  });

  return Promise.all(paymentAttempts);
}
