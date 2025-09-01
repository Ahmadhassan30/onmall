import { v2 as cloudinary } from 'cloudinary';

export function assertCloudinaryEnv() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env as Record<string, string | undefined>;
  const missing: string[] = [];
  if (!CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
  if (missing.length) {
    const msg = `Cloudinary env missing: ${missing.join(', ')}`;
    return { ok: false as const, message: msg };
  }
  return { ok: true as const };
}

// Configure once per runtime for product uploads
const envOk = assertCloudinaryEnv();
if (envOk.ok) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };
