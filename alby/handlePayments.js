import jwt from "jsonwebtoken";
import processPayments from "./payments/processPayments.js";

const handlePayments = async (req, res) => {
  let accessToken, keysends, lnurlp;
  try {
    const { ALBY_JWT } = process.env;
    const cookies = req.cookies;
    let alby = cookies.awt ? jwt.verify(cookies.awt, ALBY_JWT) : undefined;
    accessToken = alby.access_token;

    const body = [].concat(req.body);
    keysends = body.filter((v) => v.type === "node");

    lnurlp = await Promise.all(
      body
        .filter((v) => v.type === "lnaddress")
        .map(async (split) => {
          const [name, server] = split.destination.split("@");
          const paymentUrl = `https://${server}/.well-known/keysend/${name}`;

          try {
            const res = await fetch(paymentUrl);
            const data = await res.json();
            if (data.pubkey) {
              Object.assign(split, { type: "node", destination: data.pubkey });
              if (data?.customData?.customKey) {
                split.customRecords[data.customData.customKey] =
                  data.customData.customValue;
              }
            }
          } catch (err) {}
          return split;
        })
    );

    keysends.push(...lnurlp.filter((v) => v.type === "node"));
    lnurlp = lnurlp.filter((v) => v.type === "lnaddress");

    let splits = [...keysends, ...lnurlp];

    let completedPayments = await processPayments(accessToken, splits);

    res.status(200).json({ splits, completedPayments });
  } catch (err) {
    console.log("handlePayment Error: " + err);
    res.status(500).json({ message: "Server Error" });
  }
};

export default handlePayments;
