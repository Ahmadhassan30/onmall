import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import { currentUser } from '@/lib/current-user'
// Note: Cloudinary configured centrally in lib/cloudinary

interface CloudinaryUploadResult {
    public_id: string;
    [key: string]: any
}

export async function POST(request: NextRequest) {
    const user = await currentUser();

    if (!user) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if(!file){
            return NextResponse.json({error: "File not found"}, {status: 400})
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

    const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {folder: "next-cloudinary-uploads"},
                    (error, result) => {
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                )
                uploadStream.end(buffer)
            }
        )
        return NextResponse.json(
            {
                result
            },
            {
                status: 200
            }
        )

    } catch (error: any) {
        console.log("UPload image failed", error)
        const message = error?.message?.includes('cloud_name') ? 'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET' : 'Upload image failed';
        return NextResponse.json({error: message}, {status: 500})
    }

}