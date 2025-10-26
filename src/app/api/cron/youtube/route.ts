import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Check for authorization if needed
  const authHeader = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch and update all YouTube data
    const endpoints = [
      "/api/youtube/channel",
      "/api/youtube/recent-videos",
      "/api/youtube/playlists",
      "/api/youtube/playlist-items",
    ]

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        return {
          endpoint,
          status: response.status,
          data: await response.json(),
        }
      }),
    )

    return NextResponse.json({
      message: "YouTube data sync completed",
      results,
    })
  } catch (error: any) {
    console.error(`Cron job failed: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

