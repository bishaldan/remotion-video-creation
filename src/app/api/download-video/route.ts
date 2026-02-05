import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const renderId = searchParams.get("renderId");
  const filename = searchParams.get("filename") || "video";

  if (!renderId) {
    return NextResponse.json({ error: "renderId is required" }, { status: 400 });
  }

  // Look for file in the out directory
  const outputDir = path.join(process.cwd(), "out");
  const filePath = path.join(outputDir, `${renderId}.mp4`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Read the file stats
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  
  // Read the file as a stream

  // Return the file as a downloadable attachment
  // Note: Streaming via NextResponse/Response in Next.js App Router
  // We can pass the Web ReadableStream or Node stream (via `iteratorToStream` web util if needed, 
  // but Next.js often handles Node streams in NextResponse directly or via `new Response(stream)`).
  // A simpler way for modern Next.js is using `new Response` with the stream.
  
  // Convert node stream to web stream for standard Response compatibility if needed, 
  // but let's try passing the readable stream directly to NextResponse first, usually works in Node runtime.
  // Actually, for file downloads, reading into a buffer might be safer for small files, 
  // or using the `stream-to-web` utilities. 
  // Given `renderMedia` output might be large, streaming is better.
  
  // Simple buffer approach for now to ensure compatibility, assuming videos aren't massive (a few MBs).
  // If they are large, we should use streaming properly.
  // Let's use `fs.readFileSync` for simplicity if files are < 100MB, 
  // but better to use `fs.createReadStream` and pass it to `new Response`.
  
  // Node.js readable stream to Web Stream:
  const stream = new ReadableStream({
    start(controller) {
        const reader = fs.createReadStream(filePath);
        reader.on("data", (chunk) => controller.enqueue(chunk));
        reader.on("end", () => controller.close());
        reader.on("error", (err) => controller.error(err));
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": fileSize.toString(),
      "Content-Disposition": `attachment; filename="${filename}.mp4"`,
    },
  });
}
