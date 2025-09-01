import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function GET() {
  try {
    // Test different possible cloud names
    const possibleCloudNames = [
      'onmallkyc',
      'onmall-kyc', 
      'onmall',
      'OnMall',
      'ahmadhassan30', // Often the username
      'your-username', // Replace with your actual username if known
    ];

    const testResults = [];

    for (const cloudName of possibleCloudNames) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true,
        });

        // Try to get usage info - this will fail if cloud name is wrong
        const result = await cloudinary.api.usage();
        testResults.push({ cloudName, status: 'SUCCESS', credits: result.credits });
        break; // Found the working one
      } catch (error: any) {
        testResults.push({ 
          cloudName, 
          status: 'FAILED', 
          error: error.message,
          httpCode: error.http_code 
        });
      }
    }

    return NextResponse.json({ 
      message: 'Cloud name test results',
      results: testResults,
      note: 'Look for the one with status SUCCESS - that\'s your cloud name!'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error.message 
    }, { status: 500 });
  }
}
