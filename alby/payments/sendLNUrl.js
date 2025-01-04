import axios from "axios";

export default function sendKeysend({ accessToken, recipient }) {
  return new Promise(async (resolve, reject) => {
    try {
      // Throwing an error for testing purposes
      // throw new Error("Intentional test error");

      let paymentData;
      if (recipient.amount) {
        const paymentRes = await axios.post(
          "https://api.getalby.com/payments/keysend",
          recipient,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        paymentData = paymentRes.data;
      } else {
        paymentData = { amount: 0, status: "no sats sent, amount too low" };
      }
      resolve({
        success: true,
        recipient: recipient,
        paymentData,
      });
    } catch (error) {
      console.log("Keysend Payment Error:", error.message || error);
      let err = error.message || error;
      resolve({ success: false, recipient, err });
    }
  });
}
