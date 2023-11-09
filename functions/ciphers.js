import crypto from "crypto-browserify";
import dotenv from "dotenv";

const algorithm = "aes-256-cbc";
const IV_LENGTH = 16;

if (!process.env.JWT) {
  dotenv.config();
}

const { JWT } = process.env;

export async function encrypt(text) {
  let key = JWT;
  if (!text) return;
  try {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString("hex") + encrypted.toString("hex");
  } catch (err) {
    console.log(err);
    return;
  }
}

export async function decrypt(text) {
  let key = JWT;

  try {
    let iv = Buffer.from(text.slice(0, 32), "hex");
    let encryptedText = Buffer.from(text.slice(32), "hex");
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (err) {
    console.log(err);
    return;
  }
}

export function vEncrypt(message, codeword) {
  var abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    result = "",
    cipher,
    x,
    y;

  if (!message || !codeword) {
    return null;
  }

  codeword = codeword.slice(0, message.length);

  for (var i = 0; i < message.length; i++) {
    if (abc.indexOf(message[i]) === -1) {
      result += message[i];
    } else {
      cipher = codeword[i % codeword.length];
      x = abc.indexOf(cipher);
      y = abc.indexOf(message[i]);
      result += abc[(y - x + abc.length) % abc.length];
    }
  }

  return result;
}

export function vDecrypt(message, codeword) {
  var abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    result = "",
    cipher,
    x,
    y;

  if (!message || !codeword) {
    return null;
  }

  codeword = codeword.slice(0, message.length);

  for (var i = 0; i < message.length; i++) {
    if (abc.indexOf(message[i]) === -1) {
      result += message[i];
    } else {
      cipher = codeword[i % codeword.length];
      x = abc.indexOf(cipher);
      y = abc.indexOf(message[i]);
      result += abc[(x + y) % abc.length];
    }
  }

  return result;
}
