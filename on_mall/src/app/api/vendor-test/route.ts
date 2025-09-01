import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Vendor API test endpoint working',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Vendor POST test endpoint working',
    timestamp: new Date().toISOString()
  });
}
