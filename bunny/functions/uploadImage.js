import dotenv from "dotenv";
import https from "https";
import * as fsSync from "fs";
import fetch from "node-fetch";

dotenv.config();

// Ensure all necessary environment variables are set
if (
  !process.env.BUNNY_REGION ||
  !process.env.IMAGE_ZONE ||
  !process.env.IMAGE_API_KEY ||
  !process.env.IMAGE_FILE
) {
  throw new Error("Missing one or more required environment variables.");
}

const REGION = process.env.BUNNY_REGION;
const BASE_HOSTNAME = "storage.bunnycdn.com";
const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
const STORAGE_ZONE_NAME = process.env.IMAGE_ZONE;
const ACCESS_KEY = process.env.IMAGE_API_KEY;
const BUNNY_API_ACCOUNT_KEY = process.env.BUNNY_API_ACCOUNT_KEY;
const IMAGE_FILE = process.env.IMAGE_FILE.startsWith("/")
  ? process.env.IMAGE_FILE.substring(1)
  : process.env.IMAGE_FILE;

export default async function uploadImage({ clientSocket }) {
  try {
    const options = {
      method: "PUT",
      host: HOSTNAME,
      path: `/${STORAGE_ZONE_NAME}/${IMAGE_FILE}`,
      headers: {
        AccessKey: ACCESS_KEY,
        "Content-Type": "image/jpeg", // Change this if uploading different image types
      },
    };

    const fileStats = fsSync.statSync(`./${IMAGE_FILE}`);
    const totalSize = fileStats.size;
    let uploadedSize = 0;

    const readStream = fsSync.createReadStream(`./${IMAGE_FILE}`);

    readStream.on("data", (chunk) => {
      uploadedSize += chunk.length;
      const progress = (uploadedSize / totalSize) * 100;
      clientSocket.emit("imageUploadProgress", {
        progress,
        uploadedSize,
        totalSize,
      });
    });

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseBody = "";

        res.on("data", (chunk) => {
          responseBody += chunk.toString("utf8");
        });

        res.on("end", async () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log("Upload successful");
            resolve(); // Resolve on successful completion
          } else {
            reject(
              new Error(`Request failed with status code: ${res.statusCode}`)
            );
          }
        });
      });

      req.on("error", (error) => {
        console.error(error);
        clientSocket.emit("bunnySaving", { saving: false });
        reject(error);
      });

      readStream.on("error", (error) => {
        console.error("ReadStream error:", error);
        reject(error);
      });

      readStream.pipe(req);
    });
  } catch (error) {
    console.error("Upload error:", error);
    throw error; // Rethrow to handle externally if needed
  }
}

async function purgeCDN(url) {
  const _url = `https://api.bunny.net/purge?url=${encodeURIComponent(url)}`;
  const options = {
    method: "GET",
    headers: { accept: "application/json", AccessKey: BUNNY_API_ACCOUNT_KEY },
  };

  try {
    let res = await fetch(_url, options);
    const data = res.status;
    console.log(data);
    return data;
  } catch (error) {
    throw error;
  }
}
