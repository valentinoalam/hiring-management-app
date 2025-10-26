import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { createYouTubeUrl, fetchFromYouTube, mapChannelData } from "@/lib/youtube"

const prisma = new PrismaClient()

export async function GET() {
  return NextResponse.json({ message: "Use POST request to fetch and update channel info" })
}

export async function POST() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID

    const channelUrl = createYouTubeUrl("channels")
    channelUrl.searchParams.set("part", "snippet")
    channelUrl.searchParams.set("id", channelId || "")

    const data = await fetchFromYouTube(channelUrl)
    const { items } = data

    // Save to database using Prisma
    const savedChannels = await Promise.all(
      items.map(async (item: any) => {
        const channelData = mapChannelData(item)

        return await prisma.channel.upsert({
          where: { id: channelData.id },
          update: channelData,
          create: channelData,
        })
      }),
    )

    return NextResponse.json({
      message: "Channel info fetched and saved successfully",
      count: savedChannels.length,
    })
  } catch (error: any) {
    if (error.message === "HTTP error: 403") {
      return NextResponse.json({ error: "403", message: "Forbidden" }, { status: 403 })
    }
    console.error(`Could not get channel info: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

