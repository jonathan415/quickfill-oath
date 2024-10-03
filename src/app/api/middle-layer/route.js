import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { method, url, headers, params, body, auth, cookies } = await req.json();

    if (!url || !method) {
      return NextResponse.json({ message: "URL and method are required" }, { status: 400 });
    }

    let authHeaders = {};
    if (auth) {
      if (auth.type === "basic") {
        const encodedCredentials = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
        authHeaders.Authorization = `Basic ${encodedCredentials}`;
      } else if (auth.type === "bearer") {
        authHeaders.Authorization = `Bearer ${auth.token}`;
      }
    }

    let cookieHeader = "";
    if (cookies) {
      cookieHeader = Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join("; ");
    }

    const finalHeaders = {
      ...headers,
      ...authHeaders,
      Cookie: cookieHeader,
    };

    const config = {
      method: method.toLowerCase(),
      url,
      headers: finalHeaders,
      params: method === "GET" ? params : undefined,
      data: method === "POST" ? body : undefined,
    };

    const response = await axios(config);

    return NextResponse.json({
      status: response.status,
      data: response.data,
    });

  } catch (error) {
    console.error("Error with API call:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
