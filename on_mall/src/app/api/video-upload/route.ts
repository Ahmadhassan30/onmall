import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/current-user';
import { cloudinary } from '@/lib/cloudinary';

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number
    [key: string]: any
}

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'File not found' }, { status: 400 });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'video',
                    folder: 'product-videos',
                    // Keep videos public so they can render on landing page
                    access_mode: 'public',
                    transformation: [{ quality: 'auto', fetch_format: 'mp4' }],
                },
                (error, res) => (error ? reject(error) : resolve(res as CloudinaryUploadResult))
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log('Upload video failed', error);
        return NextResponse.json({ error: 'Upload video failed' }, { status: 500 });
    }
}