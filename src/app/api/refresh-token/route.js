import axios from "axios";
import querystring from "querystring";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { message: "Refresh token is required" },
        { status: 400 },
      );
    }

    const requestBody = querystring.stringify({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      requestBody,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const user = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
        },
      },
    );

    return NextResponse.json({
      message: "success",
      data: response.data,
      userData: user.data,
    });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);

    return NextResponse.json({ error: "Error" }, { status: 400 });
  }
}
