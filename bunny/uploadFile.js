import https from "https";
import busboy from "busboy";

// Main function to handle file upload
const uploadFile = (req, res, bunnySettings) => {
  const { hostname, username, password, apiKey } = bunnySettings;
  const FILES_URL = `https://${username}.b-cdn.net/`;

  console.log;

  const bb = busboy({ headers: req.headers });
  let fields = {};

  bb.on("field", (name, value) => {
    fields[name] = value;
  });

  bb.on("file", (name, file, info) => {
    const { folderName, fileName } = fields;
    const contentType = info.mimetype || "application/octet-stream";
    const filePath = folderName ? `${folderName}/${fileName}` : fileName;
    const encodedFilename = filePath
      .split("/")
      .map((v) => encodeURIComponent(v))
      .join("/");

    const options = {
      method: "PUT",
      host: hostname,
      path: `/${username}/${encodedFilename}`,
      headers: {
        AccessKey: password,
        "Content-Type": contentType,
      },
    };

    const uploadReq = https.request(options, (uploadRes) => {
      let responseBody = "";

      uploadRes.on("data", (chunk) => {
        responseBody += chunk.toString("utf8");
      });

      uploadRes.on("end", () => {
        if (uploadRes.statusCode === 200 || uploadRes.statusCode === 201) {
          // After successful upload, purge the CDN cache
          purgeCDNCache(encodedFilename, FILES_URL)
            .then(() => {
              res.status(200).json({
                message: "Upload and CDN purge successful!",
                url: `${FILES_URL}${encodedFilename}`,
              });
            })
            .catch((error) => {
              res.status(500).json({
                message: "Upload successful, but CDN purge failed.",
                error: error.message,
              });
            });
        } else {
          res.status(uploadRes.statusCode).json({
            message: `Failed to upload file. Status: ${uploadRes.statusCode}`,
            error: responseBody,
          });
        }
      });
    });

    uploadReq.on("error", (error) => {
      console.error("Upload error:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    });

    file.pipe(uploadReq);
  });

  bb.on("finish", () => {
    console.log("Upload complete.");
  });

  bb.on("error", (error) => {
    console.error("Busboy error:", error);
    res
      .status(500)
      .json({ message: "Error processing upload", error: error.message });
  });

  req.pipe(bb);

  // Function to purge CDN cache
  function purgeCDNCache(filePath, FILES_URL) {
    return new Promise((resolve, reject) => {
      const options = {
        method: "POST",
        hostname: "bunnycdn.com",
        path: `/api/purge?url=${encodeURIComponent(`${FILES_URL}${filePath}`)}`,
        headers: {
          AccessKey: apiKey,
          Accept: "application/json",
        },
      };

      const purgeReq = https.request(options, (purgeRes) => {
        let data = "";

        purgeRes.on("data", (chunk) => {
          data += chunk;
        });

        purgeRes.on("end", () => {
          if (purgeRes.statusCode === 200) {
            console.log("CDN cache purged successfully.");
            resolve();
          } else {
            console.error("CDN purge failed:", data);
            reject(
              new Error(`CDN purge failed with status: ${purgeRes.statusCode}`)
            );
          }
        });
      });

      purgeReq.on("error", (error) => {
        console.error("Purge request error:", error);
        reject(error);
      });

      purgeReq.end();
    });
  }
};

// Export the uploadFile function
export default uploadFile;
