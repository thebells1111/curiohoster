import axios from "axios";
import jwt from "jsonwebtoken";

const payInvoice = async (req, res) => {
  const { ALBY_JWT } = process.env;

  try {
    const { invoice } = req.body;

    const cookies = req.cookies;

    let alby = cookies.awt ? jwt.verify(cookies.awt, ALBY_JWT) : undefined;

    if (alby && invoice) {
      const paymentRes = await axios.post(
        "https://api.getalby.com/payments/bolt11",
        { invoice },
        {
          headers: { Authorization: `Bearer ${alby.access_token}` },
        }
      );

      res.json({
        success: true,
        info: paymentRes.data,
      });
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error("alby lnurlp: " + err);
    res.status(500).json({ message: "Server Error" });
  }
};

export default payInvoice;
