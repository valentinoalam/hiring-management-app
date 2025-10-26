import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const fetchFromYouTube = async (url: URL) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`)
  }
  return await response.json()
}

export const createYouTubeUrl = (endpoint: string) => {
  const url = new URL(`https://youtube.googleapis.com/youtube/v3/${endpoint}`)
  url.searchParams.set("key", process.env.GOOGLE_API_KEY || "")
  return url
}

export const mapVideoData = (item: any) => {
  return {
    id: item.id.videoId || item.id,
    kind: item.id.kind || item.kind,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: new Date(item.snippet.publishedAt),
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
  }
}

export const mapPlaylistData = (item: any) => {
  return {
    id: item.id,
    kind: item.kind,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: new Date(item.snippet.publishedAt),
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
  }
}

export const mapPlaylistItemData = (item: any) => {
  return {
    id: item.id,
    playlistId: item.snippet.playlistId,
    videoId: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: new Date(item.snippet.publishedAt),
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
  }
}

export const mapChannelData = (item: any) => {
  return {
    id: item.id,
    kind: item.kind,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: new Date(item.snippet.publishedAt),
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
  }
}

