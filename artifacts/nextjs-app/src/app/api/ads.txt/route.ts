import { NextResponse } from 'next/server';

export async function GET() {
  const adsContent = `adsgram.ai, 52779, DIRECT, 56f9c9ab7e9e4f7984a8e6b4a19b9ea9`;

  return new NextResponse(adsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}