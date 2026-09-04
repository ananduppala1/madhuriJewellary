import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const CLOUDINARY_FOLDERS = {
  products: `${env.CLOUDINARY_FOLDER}/products`,
  gallery: `${env.CLOUDINARY_FOLDER}/gallery`,
  collections: `${env.CLOUDINARY_FOLDER}/collections`,
  seed: `${env.CLOUDINARY_FOLDER}/seed`,
} as const;
