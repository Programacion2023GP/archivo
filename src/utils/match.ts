// similarityCheck.ts - VERSIÓN MEJORADA Y OPTIMIZADA

/**
 * Configuración avanzada para búsqueda de similitud
 */
interface SimilarityConfig {
  minSimilarity: number;         // Umbral mínimo para considerar coincidencia
  useStrictMode: boolean;        // Modo estricto (solo coincidencias exactas)
  caseSensitive: boolean;        // Distingue mayúsculas/minúsculas
  ignoreAccents: boolean;        // Ignorar acentos
  ignorePunctuation: boolean;    // Ignorar puntuación
  matchThreshold: number;        // Umbral para considerar palabras similares (0-1)
  firstWordBonus: number;        // Bonus por primera palabra coincidente
  lastWordBonus: number;         // Bonus por última palabra coincidente
  lengthWeight: number;          // Peso por longitud del texto
  requireWordOrder: boolean;     // Requerir orden de palabras similar
}

const DEFAULT_CONFIG: SimilarityConfig = {
  minSimilarity: 65,
  useStrictMode: false,
  caseSensitive: false,
  ignoreAccents: true,
  ignorePunctuation: true,
  matchThreshold: 0.7,
  firstWordBonus: 15,
  lastWordBonus: 10,
  lengthWeight: 1.1,
  requireWordOrder: false,
};

/**
 * Resultado de similitud con información detallada
 */
interface SimilarityResult<T> {
  item: T;
  similarity: number;
  matchedWords: string[];
  details?: {
    wordScore: number;
    levenshteinScore: number;
    bonuses: number;
    penalties: number;
  };
}

/**
 * Encuentra el elemento más similar en el array con opciones avanzadas
 */
export function findMostSimilar<T>(
  array: T[],
  key: keyof T | ((item: T) => string),
  searchText: string,
  config: Partial<SimilarityConfig> = {}
): SimilarityResult<T> | null {
  if (!array?.length || !searchText) {
    return null;
  }

  const mergedConfig: SimilarityConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Determinar si key es función o propiedad
  const getValue = typeof key === 'function' 
    ? key 
    : (item: T) => String(item[key] ?? '');

  const normalizedSearch = normalizeText(searchText, mergedConfig);
  
  if (!normalizedSearch) {
    return null;
  }

  // Ajustar configuración basada en longitud de búsqueda
  const adjustedConfig = adjustConfigByLength(normalizedSearch, mergedConfig);
  
  let bestMatch: SimilarityResult<T> | null = null;
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length >= 2);

  for (const item of array) {
    const value = getValue(item);
    
    if (!value) {
      continue;
    }

    const normalizedValue = normalizeText(value, adjustedConfig);
    
    if (!normalizedValue) {
      continue;
    }

    const result = calculateDetailedSimilarity(
      normalizedValue,
      normalizedSearch,
      searchWords,
      adjustedConfig
    );

    if (result.similarity >= adjustedConfig.minSimilarity) {
      if (!bestMatch || result.similarity > bestMatch.similarity) {
        bestMatch = {
          item,
          similarity: result.similarity,
          matchedWords: result.matchedWords,
          details: {
            wordScore: result.wordScore,
            levenshteinScore: result.levenshteinScore,
            bonuses: result.bonuses,
            penalties: result.penalties,
          }
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Ajusta configuración basada en longitud del texto de búsqueda
 */
function adjustConfigByLength(searchText: string, config: SimilarityConfig): SimilarityConfig {
  const length = searchText.length;
  const wordCount = searchText.split(/\s+/).length;
  
  const adjustedConfig = { ...config };
  
  // Para búsquedas muy cortas
  if (length < 3) {
    adjustedConfig.minSimilarity = 90;
    adjustedConfig.useStrictMode = true;
    adjustedConfig.matchThreshold = 0.9;
  }
  // Para búsquedas cortas (3-10 caracteres)
  else if (length < 10) {
    adjustedConfig.minSimilarity = Math.max(config.minSimilarity, 75);
    adjustedConfig.matchThreshold = Math.min(config.matchThreshold + 0.1, 0.95);
  }
  // Para una sola palabra
  else if (wordCount === 1) {
    adjustedConfig.minSimilarity = Math.max(config.minSimilarity, 70);
    adjustedConfig.firstWordBonus = 20;
    adjustedConfig.lastWordBonus = 0;
  }
  // Para muchas palabras
  else if (wordCount > 4) {
    adjustedConfig.minSimilarity = Math.max(config.minSimilarity - 5, 50);
    adjustedConfig.matchThreshold = Math.max(config.matchThreshold - 0.1, 0.5);
  }
  
  return adjustedConfig;
}

/**
 * Calcula similitud con detalles
 */
function calculateDetailedSimilarity(
  text1: string,
  text2: string,
  searchWords: string[],
  config: SimilarityConfig
): {
  similarity: number;
  wordScore: number;
  levenshteinScore: number;
  bonuses: number;
  penalties: number;
  matchedWords: string[];
} {
  // Casos base
  if (text1 === text2) {
    return {
      similarity: 100,
      wordScore: 100,
      levenshteinScore: 100,
      bonuses: 0,
      penalties: 0,
      matchedWords: text1.split(/\s+/),
    };
  }

  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  
  // 1. Calcular puntuación por palabras
  const { score: wordScore, matchedWords } = calculateWordSimilarity(
    words1,
    words2,
    config
  );
  
  // 2. Calcular puntuación por Levenshtein (solo si no hay buena coincidencia de palabras)
  let levenshteinScore = 0;
  if (wordScore < 70 || text1.length < 10 || text2.length < 10) {
    const distance = optimizedLevenshtein(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    levenshteinScore = (1 - distance / maxLength) * 100;
  }
  
  // 3. Calcular bonificaciones
  let bonuses = 0;
  
  // Bonificación por primera palabra
  if (words1[0] && words2[0] && areWordsSimilar(words1[0], words2[0], config.matchThreshold)) {
    bonuses += config.firstWordBonus;
  }
  
  // Bonificación por última palabra
  if (words1[words1.length - 1] && words2[words2.length - 1] && 
      areWordsSimilar(words1[words1.length - 1], words2[words2.length - 1], config.matchThreshold)) {
    bonuses += config.lastWordBonus;
  }
  
  // Bonificación por orden de palabras
  if (config.requireWordOrder && matchedWords.length > 1) {
    const orderBonus = calculateOrderBonus(words1, words2, matchedWords);
    bonuses += orderBonus;
  }
  
  // 4. Calcular penalizaciones
  let penalties = 0;
  
  // Penalización por diferencia de longitud extrema
  const lengthRatio = Math.min(text1.length, text2.length) / Math.max(text1.length, text2.length);
  if (lengthRatio < 0.5) {
    penalties += 20;
  }
  
  // Penalización por primera letra diferente
  if (text1[0] !== text2[0]) {
    penalties += 10;
  }
  
  // 5. Combinar puntuaciones
  let finalScore: number;
  
  if (wordScore >= 50) {
    // Priorizar puntuación de palabras si es buena
    finalScore = wordScore;
  } else if (levenshteinScore >= 60 && text1.length >= 5 && text2.length >= 5) {
    // Usar Levenshtein para textos medianos/largos
    finalScore = levenshteinScore;
  } else {
    // Combinar ambos métodos
    const wordWeight = wordScore > 0 ? 0.6 : 0.2;
    const levenshteinWeight = 1 - wordWeight;
    finalScore = (wordScore * wordWeight) + (levenshteinScore * levenshteinWeight);
  }
  
  // Aplicar bonificaciones y penalizaciones
  finalScore = Math.min(100, Math.max(0, finalScore + bonuses - penalties));
  
  // Aplicar peso por longitud
  if (text2.length >= 5) {
    finalScore = Math.min(100, finalScore * config.lengthWeight);
  }
  
  return {
    similarity: finalScore,
    wordScore,
    levenshteinScore,
    bonuses,
    penalties,
    matchedWords,
  };
}

/**
 * Calcula similitud entre arrays de palabras
 */
function calculateWordSimilarity(
  words1: string[],
  words2: string[],
  config: SimilarityConfig
): { score: number; matchedWords: string[] } {
  if (!words1.length || !words2.length) {
    return { score: 0, matchedWords: [] };
  }
  
  const matchedWords: string[] = [];
  let matchCount = 0;
  
  // Para modo estricto
  if (config.useStrictMode) {
    const strictMatches = words1.filter(w1 => 
      w1.length >= 2 && words2.includes(w1)
    );
    matchCount = strictMatches.length;
    matchedWords.push(...strictMatches);
  } else {
    // Para modo normal
    for (const word1 of words1) {
      if (word1.length < 2) continue;
      
      // Buscar palabra similar
      const similarWord = words2.find(word2 => 
        areWordsSimilar(word1, word2, config.matchThreshold)
      );
      
      if (similarWord) {
        matchCount++;
        matchedWords.push(word1);
      }
    }
  }
  
  // Calcular puntuación basada en coincidencias
  const totalWords = Math.max(words1.length, words2.length);
  const baseScore = (matchCount / totalWords) * 100;
  
  // Bonificación por proporción de texto cubierto
  const matchedLength = matchedWords.join('').length;
  const totalLength = Math.max(
    words1.join('').length,
    words2.join('').length
  );
  const coverageBonus = (matchedLength / totalLength) * 20;
  
  const finalScore = Math.min(100, baseScore + coverageBonus);
  
  return { score: finalScore, matchedWords };
}

/**
 * Verifica si dos palabras son similares
 */
function areWordsSimilar(word1: string, word2: string, threshold: number): boolean {
  if (word1 === word2) return true;
  if (!word1 || !word2) return false;
  
  // Para palabras muy cortas
  if (word1.length < 3 || word2.length < 3) {
    return word1 === word2;
  }
  
  // Verificar si una contiene a la otra
  if (word1.includes(word2) || word2.includes(word1)) {
    return true;
  }
  
  // Calcular distancia de edición
  const distance = optimizedLevenshtein(word1, word2);
  const similarity = 1 - distance / Math.max(word1.length, word2.length);
  
  return similarity >= threshold;
}

/**
 * Calcula bonificación por orden de palabras
 */
function calculateOrderBonus(words1: string[], words2: string[], matchedWords: string[]): number {
  if (matchedWords.length < 2) return 0;
  
  let orderScore = 0;
  const positions1: number[] = [];
  const positions2: number[] = [];
  
  // Obtener posiciones de palabras coincidentes
  for (const word of matchedWords) {
    const pos1 = words1.indexOf(word);
    const pos2 = words2.indexOf(word);
    
    if (pos1 !== -1 && pos2 !== -1) {
      positions1.push(pos1);
      positions2.push(pos2);
    }
  }
  
  // Calcular correlación de orden
  if (positions1.length >= 2) {
    const orderDiff = positions1.reduce((sum, pos1, i) => {
      const pos2 = positions2[i];
      return sum + Math.abs(pos1 - pos2);
    }, 0);
    
    const maxDiff = Math.max(...positions1) * positions1.length;
    orderScore = 20 * (1 - orderDiff / maxDiff);
  }
  
  return orderScore;
}

/**
 * Normaliza texto según configuración
 */
function normalizeText(text: string, config: SimilarityConfig): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let result = text.trim();
  
  if (!config.caseSensitive) {
    result = result.toLowerCase();
  }
  
  if (config.ignoreAccents) {
    result = result
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
  
  if (config.ignorePunctuation) {
    result = result.replace(/[^\w\s]/g, ' ');
  }
  
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Levenshtein optimizado para performance
 */
function optimizedLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  // Intercambiar para usar la cadena más corta como b
  if (a.length < b.length) {
    [a, b] = [b, a];
  }
  
  // Optimización para diferencias grandes
  const lengthDiff = a.length - b.length;
  if (lengthDiff > a.length * 0.3) {
    return Math.ceil(a.length * 0.7);
  }
  
  // Algoritmo de Wagner-Fischer optimizado
  const previousRow = new Array(b.length + 1);
  const currentRow = new Array(b.length + 1);
  
  for (let j = 0; j <= b.length; j++) {
    previousRow[j] = j;
  }
  
  for (let i = 1; i <= a.length; i++) {
    currentRow[0] = i;
    
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        previousRow[j - 1] + cost,    // sustitución
        previousRow[j] + 1,           // inserción
        currentRow[j - 1] + 1         // eliminación
      );
    }
    
    // Swap rows
    for (let j = 0; j <= b.length; j++) {
      previousRow[j] = currentRow[j];
    }
  }
  
  return previousRow[b.length];
}

/**
 * FUNCIONES PÚBLICAS SIMPLIFICADAS
 */

export const findBestMatch = <T>(
  items: T[],
  field: keyof T | ((item: T) => string),
  search: string,
  minPercent: number = 65
): { item: T; percent: number; matchedWords?: string[] } | null => {
  const result = findMostSimilar(items, field, search, { minSimilarity: minPercent });
  
  if (!result) return null;
  
  return {
    item: result.item,
    percent: Math.round(result.similarity),
    matchedWords: result.matchedWords,
  };
};

export const findMatch = <T>(
  items: T[],
  field: keyof T | ((item: T) => string),
  search: string,
  minPercent: number = 65
): T | null => {
  const result = findMostSimilar(items, field, search, { minSimilarity: minPercent });
  return result?.item || null;
};

export const getMatchPercent = <T>(
  items: T[],
  field: keyof T | ((item: T) => string),
  search: string,
  config: Partial<SimilarityConfig> = {}
): number => {
  const result = findMostSimilar(items, field, search, config);
  return Math.round(result?.similarity || 0);
};

export const compareSimilarity = (
  text1: string,
  text2: string,
  config: Partial<SimilarityConfig> = {}
): number => {
  const mergedConfig: SimilarityConfig = { ...DEFAULT_CONFIG, ...config };
  const normalized1 = normalizeText(text1, mergedConfig);
  const normalized2 = normalizeText(text2, mergedConfig);
  
  if (!normalized1 || !normalized2) return 0;
  
  const searchWords = normalized2.split(/\s+/).filter(w => w.length >= 2);
  const result = calculateDetailedSimilarity(
    normalized1,
    normalized2,
    searchWords,
    mergedConfig
  );
  
  return Math.round(result.similarity);
};

export const findAllMatches = <T>(
  items: T[],
  field: keyof T | ((item: T) => string),
  search: string,
  minPercent: number = 65,
  limit: number = 10
): Array<{ item: T; percent: number; matchedWords: string[] }> => {
  if (!items?.length || !search) return [];
  
  const mergedConfig: SimilarityConfig = { ...DEFAULT_CONFIG, minSimilarity: minPercent };
  const normalizedSearch = normalizeText(search, mergedConfig);
  
  if (!normalizedSearch) return [];
  
  const results: Array<{ item: T; percent: number; matchedWords: string[] }> = [];
  const getValue = typeof field === 'function' 
    ? field 
    : (item: T) => String(item[field] ?? '');
  
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length >= 2);
  
  for (const item of items) {
    const value = getValue(item);
    
    if (!value) continue;
    
    const normalizedValue = normalizeText(value, mergedConfig);
    
    if (!normalizedValue) continue;
    
    const result = calculateDetailedSimilarity(
      normalizedValue,
      normalizedSearch,
      searchWords,
      mergedConfig
    );
    
    if (result.similarity >= minPercent) {
      results.push({
        item,
        percent: Math.round(result.similarity),
        matchedWords: result.matchedWords,
      });
      
      if (results.length >= limit * 2) {
        break; // Limitar procesamiento para performance
      }
    }
  }
  
  // Ordenar y limitar resultados
  return results
    .sort((a, b) => b.percent - a.percent)
    .slice(0, limit);
};

/**
 * Función para búsqueda rápida (optimizada para performance)
 */
export const quickSearch = <T>(
  items: T[],
  field: keyof T,
  search: string,
  minSimilarity: number = 70
): T | null => {
  if (!items?.length || !search) return null;
  
  const normalizedSearch = search.toLowerCase().trim();
  if (!normalizedSearch) return null;
  
  let bestMatch: T | null = null;
  let bestScore = 0;
  
  for (const item of items) {
    const value = item[field];
    if (value === undefined || value === null) continue;
    
    const strValue = String(value).toLowerCase().trim();
    
    // Coincidencia exacta
    if (strValue === normalizedSearch) {
      return item;
    }
    
    // Coincidencia de inicio
    if (strValue.startsWith(normalizedSearch)) {
      return item;
    }
    
    // Coincidencia parcial
    if (strValue.includes(normalizedSearch)) {
      const score = (normalizedSearch.length / strValue.length) * 100;
      if (score > bestScore && score >= minSimilarity) {
        bestScore = score;
        bestMatch = item;
      }
    }
  }
  
  return bestMatch;
};

/**
 * Función para filtrar array por similitud
 */
export const filterBySimilarity = <T>(
  items: T[],
  field: keyof T | ((item: T) => string),
  search: string,
  minPercent: number = 60
): T[] => {
  const matches = findAllMatches(items, field, search, minPercent, items.length);
  return matches.map(match => match.item);
};