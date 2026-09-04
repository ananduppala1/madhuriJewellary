import multer from "multer";
import { MAX_UPLOAD_BYTES } from "../config/env.js";
import { ALLOWED_IMAGE_EXT, ALLOWED_IMAGE_MIME, MAX_IMAGES_PER_PRODUCT } from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Files are held in memory and streamed straight to Cloudinary — nothing is
 * ever written to the API's disk, so there is no upload directory to traverse
 * or serve by accident.
 *
 * Three checks run before a byte is forwarded: declared MIME type, file
 * extension, and size. The magic-byte check happens at Cloudinary, which
 * rejects anything that is not really an image.
 */

const mimes = new Set<string>(ALLOWED_IMAGE_MIME);
const extensions = new Set<string>(ALLOWED_IMAGE_EXT);

function extensionOf(filename: string): string {
  const match = /\.[^.]+$/.exec(filename.toLowerCase());
  return match ? match[0] : "";
}

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (!mimes.has(file.mimetype)) {
    callback(ApiError.unsupportedMedia("Only JPG, PNG, WebP or AVIF images are accepted"));
    return;
  }

  if (!extensions.has(extensionOf(file.originalname))) {
    callback(ApiError.unsupportedMedia("That file extension is not allowed"));
    return;
  }

  callback(null, true);
};

const limits = { fileSize: MAX_UPLOAD_BYTES, files: MAX_IMAGES_PER_PRODUCT, fields: 20 };

export const uploadSingleImage = multer({ storage, fileFilter, limits }).single("image");

export const uploadProductImages = multer({ storage, fileFilter, limits }).array(
  "images",
  MAX_IMAGES_PER_PRODUCT,
);
