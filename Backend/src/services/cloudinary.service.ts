import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary.ts";
import { logger } from "../config/logger.ts";
import { ApiError } from "../utils/ApiError.ts";
import { safeFileStem } from "../utils/slug.ts";

export type UploadedAsset = {
  publicId: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
};

/**
 * Cloudinary holds every image; Postgres only ever stores the metadata below.
 * `resource_type: "image"` makes Cloudinary reject anything that is not a real
 * image, which is the check a MIME header alone cannot give us.
 */
function upload(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", ...options },
      (error, result) => {
        if (error || !result) {
          logger.error("Cloudinary upload failed", { message: error?.message });
          reject(ApiError.badRequest("That image could not be processed"));
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export async function uploadImage(
  file: { buffer: Buffer; originalname: string },
  folder: string,
  options: { publicId?: string; overwrite?: boolean } = {},
): Promise<UploadedAsset> {
  const result = await upload(file.buffer, {
    folder,
    ...(options.publicId
      ? { public_id: options.publicId, overwrite: options.overwrite ?? true }
      : { public_id: `${safeFileStem(file.originalname)}-${Date.now().toString(36)}` }),
    unique_filename: !options.publicId,
    use_filename: false,
    overwrite: options.overwrite ?? false,
    invalidate: true,
    // Strip metadata and cap the stored dimensions — smaller originals, and no
    // GPS coordinates left inside a customer-facing photograph.
    transformation: [{ width: 2000, height: 2000, crop: "limit" }],
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width ?? null,
    height: result.height ?? null,
  };
}

/** Best-effort cleanup. A failure here must not roll back a database delete. */
export async function destroyImage(publicId: string): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (error) {
    logger.warn("Cloudinary asset could not be removed", {
      publicId,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function destroyMany(publicIds: string[]): Promise<void> {
  await Promise.all(publicIds.filter(Boolean).map((id) => destroyImage(id)));
}

/** Existence probe used by the idempotent seed so re-runs skip re-uploading. */
export async function assetExists(publicId: string): Promise<UploadedAsset | null> {
  try {
    const result = await cloudinary.api.resource(publicId, { resource_type: "image" });
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width ?? null,
      height: result.height ?? null,
    };
  } catch {
    return null;
  }
}
