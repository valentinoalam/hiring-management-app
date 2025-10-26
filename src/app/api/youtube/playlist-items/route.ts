import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { createYouTubeUrl, fetchFromYouTube, mapPlaylistItemData } from "@/lib/youtube"

const prisma = new PrismaClient()
const MAX_RESULTS = "48"

export async function GET() {
  return NextResponse.json({ message: "Use POST request to fetch and update playlist items" })
}

export async function POST() {
  try {
    // Get all playlists from the database
    const playlists = await prisma.playlist.findMany({
      select: { id: true },
    })

    const allPlaylistItems = []

    // Fetch items for each playlist
    for (let i = 2; i < playlists.length; i++) {
      const playlistId = playlists[i].id

      const playlistItemsUrl = createYouTubeUrl("playlistItems")
      playlistItemsUrl.searchParams.set("part", "snippet")
      playlistItemsUrl.searchParams.set("maxResults", MAX_RESULTS)
      playlistItemsUrl.searchParams.set("playlistId", playlistId)

      try {
        const data = await fetchFromYouTube(playlistItemsUrl)
        const { items } = data

        // Save playlist items to database
        const savedItems = await Promise.all(
          items.map(async (item: any) => {
            const itemData = mapPlaylistItemData(item)

            return await prisma.playlistItem.upsert({
              where: { id: itemData.id },
              update: itemData,
              create: itemData,
            })
          }),
        )

        allPlaylistItems.push(...savedItems)
        console.log(`Playlist ${playlistId} items fetched and saved successfully`)
      } catch (error: any) {
        if (error.message === "HTTP error: 403") {
          console.error(`Forbidden access to playlist ${playlistId}`)
          continue
        }
        console.error(`Could not get items for playlist ${playlistId}: ${error.message}`)
      }
    }

    return NextResponse.json({
      message: "All playlist items fetched and saved successfully",
      count: allPlaylistItems.length,
    })
  } catch (error: any) {
    console.error(`Could not process playlist items: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

