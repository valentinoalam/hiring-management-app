import { NextRequest, NextResponse } from 'next/server';
import wilayahData from '@/data/wilayah.json';
import * as fs from 'fs';
import * as path from 'path';

interface WilayahItem {
  kode: string;
  nama: string;
  tipe: string;
}

interface IndexedItem extends WilayahItem {
  searchable: string;
  score?: number;
}

// Cache the search engine instance
class WilayahSearchEngine {
  private data: WilayahItem[];
  private index: IndexedItem[];

  constructor(data: WilayahItem[]) {
    this.data = data;
    this.index = this.buildIndex();
  }

  private buildIndex(): IndexedItem[] {
    return this.data.map((item: WilayahItem) => ({
      ...item,
      searchable: `${item.nama} ${item.kode} ${item.tipe}`.toLowerCase()
    }));
  }

  search(query: string, limit: number = 10) {
    if (!query) return this.index.slice(0, limit);

    const queryLower = query.toLowerCase();
    
    const results = this.index
      .filter(item => {
        // Exact matches first
        if (item.nama.toLowerCase().includes(queryLower)) return true;
        if (item.kode.includes(query)) return true;
        
        // Fuzzy match
        return this.fuzzyMatch(item.nama, query);
      })
      .map(item => ({
        ...item,
        score: this.calculateScore(item, query)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  private fuzzyMatch(text: string, query: string): boolean {
    let queryIndex = 0;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    
    return queryIndex === queryLower.length;
  }

  private calculateScore(item: IndexedItem, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const namaLower = item.nama.toLowerCase();

    // Exact match gets highest score
    if (namaLower === queryLower) score += 100;
    
    // Starts with query
    if (namaLower.startsWith(queryLower)) score += 50;
    
    // Contains query
    if (namaLower.includes(queryLower)) score += 30;
    
    // Fuzzy match
    if (this.fuzzyMatch(item.nama, query)) score += 10;
    
    // Code match
    if (item.kode.includes(query)) score += 40;

    // Type weighting (province > regency > district > village)
    const typeWeights = {
      provinsi: 20,
      kabupaten: 15,
      kecamatan: 10,
      desa: 5
    };
    
    score += typeWeights[item.tipe as keyof typeof typeWeights] || 0;

    return score;
  }
}

const dataPath = path.join(process.cwd(), 'wilayah.json');
const allWilayah: WilayahItem[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Create singleton instance
const searchEngine = new WilayahSearchEngine(wilayahData as WilayahItem[]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  if (!query || query.length < 2) {
    // Return empty array if query is too short (for efficiency)
    return NextResponse.json([]);
  }
  
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const results = searchEngine.search(query, limit);
    
    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query,
        limit,
        total: results.length
      }
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}