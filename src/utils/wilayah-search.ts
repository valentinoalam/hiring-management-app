// utils/wilayahSearch.ts
interface WilayahItem {
  nama: string;
  kode: string;
  tipe: string;
}

interface IndexedItem extends WilayahItem {
  searchable: string;
}

export class WilayahSearch {
  private data: WilayahItem[];
  private index: IndexedItem[];

  constructor(data: WilayahItem[]) {
    this.data = data;
    this.index = this.buildIndex();
  }

  buildIndex(): IndexedItem[] {
    // Create a searchable index
    return this.data.map((item: WilayahItem) => ({
      ...item,
      searchable: `${item.nama} ${item.kode} ${item.tipe}`.toLowerCase()
    }));
  }

  search(query: string, limit = 10): IndexedItem[] {
    if (!query) return this.index.slice(0, limit);

    const queryLower = query.toLowerCase();
    
    return this.index
      .filter((item: IndexedItem) => {
        // Exact match
        if (item.nama.toLowerCase().includes(queryLower)) return true;
        if (item.kode.includes(query)) return true;
        
        // Fuzzy match
        return this.fuzzyMatch(item.nama, query) || 
               this.fuzzyMatch(item.searchable, queryLower);
      })
      .slice(0, limit);
  }

  fuzzyMatch(text: string, query: string): boolean {
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

  // Get suggestions based on partial input
  getSuggestions(query: string, limit = 5) {
    if (!query) return [];
    
    const results = this.search(query, limit);
    return results.map((item: IndexedItem) => ({
      text: item.nama,
      type: item.tipe,
      code: item.kode,
      score: this.calculateScore(item, query)
    }));
  }

  calculateScore(item: IndexedItem, query: string): number {
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

    return score;
  }
}