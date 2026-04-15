/**
 * Proxy: forwards all /api/* requests from the browser to Django on localhost.
 * This lets the Next.js frontend proxy all API requests to the Django backend.
 */
import { NextRequest, NextResponse } from "next/server";

// Required so Next.js never caches these proxy responses
export const dynamic = "force-dynamic";

const DJANGO_BASE = "http://localhost:8000";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  // Always end with / so Django's APPEND_SLASH doesn't issue another redirect
  const djangoUrl = `${DJANGO_BASE}/api/${path.filter(Boolean).join("/")}/${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  // Remove headers that confuse Django / Node fetch
  headers.delete("host");
  headers.delete("connection");
  headers.delete("transfer-encoding");

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    // Buffer the entire body — streaming req.body is unreliable for multipart
    // uploads through the Next.js App Router proxy layer.
    const buffer = await req.arrayBuffer();
    init.body = buffer;
    // Ensure content-length matches the buffered size
    headers.set("content-length", String(buffer.byteLength));
  }

  const upstream = await fetch(djangoUrl, init);

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
