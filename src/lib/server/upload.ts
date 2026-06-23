// Server-side image upload validation shared by avatar + check-in uploads.
// Client-supplied MIME types are not trusted blindly: we verify the file's
// magic bytes and enforce a size cap before anything reaches storage.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED = new Map<string, { ext: string; magic: number[][] }>([
    ['image/jpeg', { ext: 'jpg', magic: [[0xff, 0xd8, 0xff]] }],
    ['image/png', { ext: 'png', magic: [[0x89, 0x50, 0x4e, 0x47]] }],
    ['image/webp', { ext: 'webp', magic: [[0x52, 0x49, 0x46, 0x46]] }], // "RIFF"
    ['image/gif', { ext: 'gif', magic: [[0x47, 0x49, 0x46, 0x38]] }], // "GIF8"
]);

export type ValidatedImage = {
    buffer: Buffer;
    contentType: string;
    ext: string;
};

/**
 * Validates an uploaded image File. Throws an Error with a user-safe message
 * on any violation. Returns the verified buffer, normalized content type and
 * extension to use for the stored object.
 */
export async function validateImageUpload(file: File): Promise<ValidatedImage> {
    if (file.size === 0) {
        throw new Error('Empty file');
    }
    if (file.size > MAX_IMAGE_BYTES) {
        throw new Error('Image is too large (max 5 MB)');
    }

    const spec = ALLOWED.get(file.type);
    if (!spec) {
        throw new Error('Unsupported image type (allowed: JPEG, PNG, WebP, GIF)');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const matchesMagic = spec.magic.some((sig) =>
        sig.every((byte, i) => buffer[i] === byte)
    );
    if (!matchesMagic) {
        throw new Error('File contents do not match its declared image type');
    }

    return { buffer, contentType: file.type, ext: spec.ext };
}
