import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { createYouTubeUrl, fetchFromYouTube, mapPlaylistData } from "@/lib/youtube"

const prisma = new PrismaClient()
const MAX_RESULTS = "48"

export async function GET() {
  return NextResponse.json({ message: "Use POST request to fetch and update playlists" })
}

export async function POST() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID

    const playlistsUrl = createYouTubeUrl("playlists")
    playlistsUrl.searchParams.set("part", "snippet")
    playlistsUrl.searchParams.set("maxResults", MAX_RESULTS)
    playlistsUrl.searchParams.set("channelId", channelId || "")
    playlistsUrl.searchParams.set("order", "date")

    const data = await fetchFromYouTube(playlistsUrl)
    const { items } = data

    // Save to database using Prisma
    const savedPlaylists = await Promise.all(
      items.map(async (item: any) => {
        const playlistData = mapPlaylistData(item)

        return await prisma.playlist.upsert({
          where: { id: playlistData.id },
          update: playlistData,
          create: playlistData,
        })
      }),
    )

    return NextResponse.json({
      message: "Playlists fetched and saved successfully",
      count: savedPlaylists.length,
    })
  } catch (error: any) {
    if (error.message === "HTTP error: 403") {
      return NextResponse.json({ error: "403", message: "Forbidden" }, { status: 403 })
    }
    console.error(`Could not get playlists: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

