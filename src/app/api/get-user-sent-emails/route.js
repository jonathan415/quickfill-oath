import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { message: "Access token is required" },
        { status: 400 },
      );
    }

    const response = await axios.get(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          labelIds: "SENT",
          q: "",
        },
      },
    );

    const messages = response.data.messages;

    const messageDetails = await Promise.all(
      messages.map(async (message) => {
        const messageResponse = await axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        return messageResponse.data;
      }),
    );

    return NextResponse.json({
      message: "success",
      data: messageDetails,
    });
  } catch (error) {
    console.error("Error fetching sent emails:", error);

    return NextResponse.json(
      { error: "Error fetching sent emails", error },
      { status: 500 },
    );
  }
}
