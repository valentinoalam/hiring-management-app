import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { createYouTubeUrl, fetchFromYouTube, mapVideoData } from "@/lib/youtube"

const prisma = new PrismaClient()
const MAX_RESULTS = "48"

export async function GET() {
  return NextResponse.json({ message: "Use POST request to fetch and update recent videos" })
}

export async function POST() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID

    const videosUrl = createYouTubeUrl("search")
    videosUrl.searchParams.set("part", "snippet")
    videosUrl.searchParams.set("maxResults", MAX_RESULTS)
    videosUrl.searchParams.set("type", "video")
    videosUrl.searchParams.set("channelId", channelId || "")
    videosUrl.searchParams.set("order", "date")

    const data = await fetchFromYouTube(videosUrl)
    const { items } = data

    // Sort by publish date and filter videos with '|' in the title
    const filteredItems = items
      .sort((a: any, b: any) => new Date(a.snippet.publishedAt).getTime() - new Date(b.snippet.publishedAt).getTime())
      .filter((item: any) => item.id.kind === "youtube#video" && item.snippet.title.includes("|"))

    // Save to database using Prisma
    const savedVideos = await Promise.all(
      filteredItems.map(async (item: any) => {
        const videoData = mapVideoData(item)

        return await prisma.recentVideo.upsert({
          where: { id: videoData.id },
          update: videoData,
          create: videoData,
        })
      }),
    )

    return NextResponse.json({
      message: "Data fetched and saved successfully",
      count: savedVideos.length,
    })
  } catch (error: any) {
    console.error(`Could not get recent videos: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

