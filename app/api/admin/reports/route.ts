import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase с сервисным ключом
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Интерфейсы
interface CSVRow {
  'Reporting Month': string;
  'Sales Month': string;
  Platform: string;
  'Country/Region': string;
  'Label Name': string;
  'Artist Name': string;
  'Release title': string;
  'Track title': string;
  UPC: string;
  ISRC: string;
  'Release Catalog nb': string;
  'Release Type': string;
  'Sales Type': string;
  Quantity: string;
  'Client Payment Currency': string;
  'Net Revenue': string;
}

interface TrackData {
  isrc: string;
  upc: string;
  trackTitle: string;
  releaseTitle: string;
  artistName: string;
  streams: number;
  revenue: number;
  countries: Map<string, { streams: number; revenue: number }>;
  platforms: Map<string, { streams: number; revenue: number }>;
}

interface ProcessingResult {
  success: boolean;
  report_id?: string;
  stats: {
    totalFiles: number;
    processedFiles: number;
    totalRows: number;
    matchedTracks: number;
    unmatchedTracks: number;
    totalRevenue: number;
    totalStreams: number;
    payoutsCreated: number;
  };
  errors: string[];
}

// Парсинг CSV с умной обработкой кодировки
function parseCSV(content: string, delimiter = ';'): Record<string, string>[] {
  // Пробуем исправить кодировку если видим мусор
  let fixedContent = tryFixEncoding(content);
  
  const lines = fixedContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Парсим заголовки
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine, delimiter);
  
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      let value = (values[idx] || '').replace(/^"|"$/g, '');
      // Нормализуем значение (научная нотация, пробелы и т.д.)
      value = normalizeValue(value, header.replace(/^"|"$/g, ''));
      row[header.replace(/^"|"$/g, '')] = value;
    });
    rows.push(row);
  }
  
  return rows;
}

// Попытка исправить кодировку
function tryFixEncoding(content: string): string {
  // Проверяем есть ли мусорные символы (признак неправильной кодировки)
  const hasGarbage = /[�\uFFFD]/.test(content) || /[\x80-\x9F]/.test(content);
  
  if (!hasGarbage) {
    return content;
  }
  
  console.log('Detected encoding issues, attempting to fix...');
  
  // Пробуем различные преобразования
  try {
    // Способ 1: Windows-1251 -> UTF-8
    const decoder = new TextDecoder('windows-1251');
    const encoder = new TextEncoder();
    const bytes = new Uint8Array([...content].map(c => c.charCodeAt(0)));
    const fixed = decoder.decode(bytes);
    if (!hasGarbageChars(fixed)) {
      console.log('Fixed encoding using Windows-1251');
      return fixed;
    }
  } catch (e) {}
  
  try {
    // Способ 2: ISO-8859-1 -> UTF-8
    const decoder = new TextDecoder('iso-8859-1');
    const bytes = new Uint8Array([...content].map(c => c.charCodeAt(0)));
    const fixed = decoder.decode(bytes);
    if (!hasGarbageChars(fixed)) {
      console.log('Fixed encoding using ISO-8859-1');
      return fixed;
    }
  } catch (e) {}
  
  // Если не получилось исправить - возвращаем как есть
  console.log('Could not fix encoding, using original content');
  return content;
}

function hasGarbageChars(str: string): boolean {
  return /[�\uFFFD]/.test(str);
}

// Нормализация значений (научная нотация, пустые строки и т.д.)
function normalizeValue(value: string, fieldName: string): string {
  if (!value || value.trim() === '') return '';
  
  // Обработка научной нотации для ISRC и UPC
  if ((fieldName === 'ISRC' || fieldName === 'UPC') && /[eE][+-]?\d+/.test(value)) {
    // Заменяем запятую на точку и конвертируем
    const normalized = value.replace(',', '.');
    try {
      const num = parseFloat(normalized);
      if (!isNaN(num)) {
        // Возвращаем как целое число без экспоненты
        const result = num.toFixed(0);
        console.log(`Normalized ${fieldName}: ${value} -> ${result}`);
        return result;
      }
    } catch (e) {}
  }
  
  return value.trim();
}

// Нормализация строки для поиска
function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[«»"'"']/g, '') // Убираем кавычки
    .replace(/\s+/g, ' ') // Нормализуем пробелы
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Оставляем только буквы, цифры, пробелы
    .trim();
}

// Нечёткое сравнение строк (содержит или похоже)
function fuzzyMatch(str1: string, str2: string): boolean {
  if (!str1 || !str2) return false;
  
  // Точное совпадение
  if (str1 === str2) return true;
  
  // Одна строка содержит другую
  if (str1.includes(str2) || str2.includes(str1)) return true;
  
  // Проверяем расстояние Левенштейна для коротких строк
  if (str1.length < 20 && str2.length < 20) {
    const distance = levenshteinDistance(str1, str2);
    const maxLen = Math.max(str1.length, str2.length);
    // Допускаем 20% ошибок
    return distance <= Math.ceil(maxLen * 0.2);
  }
  
  return false;
}

// Расстояние Левенштейна
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // удаление
        dp[i][j - 1] + 1,      // вставка
        dp[i - 1][j - 1] + cost // замена
      );
    }
  }
  
  return dp[m][n];
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Определение квартала из имени папки
function parseQuarterFromPath(path: string): { quarter: string; year: number } | null {
  // Ищем паттерн "q1 2025" или "Q1 2025"
  const match = path.match(/q(\d)\s*(\d{4})/i);
  if (match) {
    return {
      quarter: `Q${match[1]}`,
      year: parseInt(match[2])
    };
  }
  return null;
}

// Поиск трека в базе данных
async function findTrackInDatabase(
  isrc: string | null,
  upc: string | null,
  trackTitle: string,
  artistName: string,
  releaseTitle: string = ''
): Promise<{
  releaseId: string | null;
  releaseType: string | null;
  userId: string | null;
  trackIndex: number | null;
  foundBy: string | null;
}> {
  try {
    // Ищем по ISRC в releases_basic - во всех статусах кроме draft/rejected
    if (isrc) {
      console.log(`Searching for ISRC: ${isrc}`);
      const isrcPrefix = isrc.substring(0, 6); // Первые 6 символов для нечёткого поиска
      
      const { data: basicReleases, error: basicError } = await supabaseAdmin
        .from('releases_basic')
        .select('id, user_id, tracks, status, artist_name')
        .in('status', ['approved', 'published', 'distributed', 'pending']);
      
      console.log(`Found ${basicReleases?.length || 0} basic releases, error: ${basicError?.message || 'none'}`);
      
      if (basicReleases) {
        for (const release of basicReleases) {
          const tracks = release.tracks || [];
          for (let i = 0; i < tracks.length; i++) {
            const trackIsrc = tracks[i]?.isrc || '';
            // Точное совпадение ИЛИ совпадение первых 6 символов
            if (trackIsrc === isrc || (trackIsrc && isrc && trackIsrc.startsWith(isrcPrefix))) {
              console.log(`ISRC match found! Release: ${release.id}, Artist: ${release.artist_name}, DB ISRC: ${trackIsrc}`);
              return {
                releaseId: release.id,
                releaseType: 'basic',
                userId: release.user_id,
                trackIndex: i,
                foundBy: trackIsrc === isrc ? 'isrc' : 'isrc_prefix'
              };
            }
          }
        }
      }
      
      // Ищем в releases_exclusive - во всех статусах кроме draft/rejected
      const { data: exclusiveReleases } = await supabaseAdmin
        .from('releases_exclusive')
        .select('id, user_id, tracks, status')
        .in('status', ['approved', 'published', 'distributed', 'pending']);
      
      if (exclusiveReleases) {
        for (const release of exclusiveReleases) {
          const tracks = release.tracks || [];
          for (let i = 0; i < tracks.length; i++) {
            const trackIsrc = tracks[i]?.isrc || '';
            if (trackIsrc === isrc || (trackIsrc && isrc && trackIsrc.startsWith(isrcPrefix))) {
              return {
                releaseId: release.id,
                releaseType: 'exclusive',
                userId: release.user_id,
                trackIndex: i,
                foundBy: 'isrc'
              };
            }
          }
        }
      }
    }
    
    // Ищем по UPC (точное и частичное совпадение)
    if (upc) {
      console.log(`Searching for UPC: ${upc}`);
      
      // Сначала точное совпадение
      const { data: basicByUpc } = await supabaseAdmin
        .from('releases_basic')
        .select('id, user_id, upc')
        .eq('upc', upc)
        .in('status', ['approved', 'published', 'distributed', 'pending'])
        .limit(1)
        .maybeSingle();
      
      if (basicByUpc) {
        console.log(`UPC exact match found! Release: ${basicByUpc.id}`);
        return {
          releaseId: basicByUpc.id,
          releaseType: 'basic',
          userId: basicByUpc.user_id,
          trackIndex: 0,
          foundBy: 'upc'
        };
      }
      
      // Нечёткий поиск по UPC (первые 6-8 цифр)
      const upcPrefix = upc.substring(0, 6);
      const { data: basicByUpcPrefix } = await supabaseAdmin
        .from('releases_basic')
        .select('id, user_id, upc')
        .ilike('upc', `${upcPrefix}%`)
        .in('status', ['approved', 'published', 'distributed', 'pending']);
      
      if (basicByUpcPrefix && basicByUpcPrefix.length > 0) {
        console.log(`UPC prefix match found! Release: ${basicByUpcPrefix[0].id}, DB UPC: ${basicByUpcPrefix[0].upc}`);
        return {
          releaseId: basicByUpcPrefix[0].id,
          releaseType: 'basic',
          userId: basicByUpcPrefix[0].user_id,
          trackIndex: 0,
          foundBy: 'upc_prefix'
        };
      }
      
      const { data: exclusiveByUpc } = await supabaseAdmin
        .from('releases_exclusive')
        .select('id, user_id, upc')
        .eq('upc', upc)
        .in('status', ['approved', 'published', 'distributed', 'pending'])
        .limit(1)
        .maybeSingle();
      
      if (exclusiveByUpc) {
        console.log(`UPC exact match found (exclusive)! Release: ${exclusiveByUpc.id}`);
        return {
          releaseId: exclusiveByUpc.id,
          releaseType: 'exclusive',
          userId: exclusiveByUpc.user_id,
          trackIndex: 0,
          foundBy: 'upc'
        };
      }
      
      // Нечёткий поиск в exclusive
      const { data: exclusiveByUpcPrefix } = await supabaseAdmin
        .from('releases_exclusive')
        .select('id, user_id, upc')
        .ilike('upc', `${upcPrefix}%`)
        .in('status', ['approved', 'published', 'distributed', 'pending']);
      
      if (exclusiveByUpcPrefix && exclusiveByUpcPrefix.length > 0) {
        console.log(`UPC prefix match found (exclusive)! Release: ${exclusiveByUpcPrefix[0].id}`);
        return {
          releaseId: exclusiveByUpcPrefix[0].id,
          releaseType: 'exclusive',
          userId: exclusiveByUpcPrefix[0].user_id,
          trackIndex: 0,
          foundBy: 'upc_prefix'
        };
      }
    }
    
    // Ищем по названию трека и артисту (с нечётким сравнением)
    if (trackTitle || artistName) {
      const normalizedTitle = normalizeForSearch(trackTitle || '');
      const normalizedArtist = normalizeForSearch(artistName || '');
      
      console.log(`Searching by title/artist. Normalized: "${normalizedTitle}" / "${normalizedArtist}"`);
      
      // В releases_basic
      const { data: basicReleases } = await supabaseAdmin
        .from('releases_basic')
        .select('id, user_id, tracks, artist_name, title')
        .in('status', ['approved', 'published', 'distributed', 'pending']);
      
      console.log(`Found ${basicReleases?.length || 0} basic releases to search through`);
      
      if (basicReleases) {
        for (const release of basicReleases) {
          const releaseArtist = normalizeForSearch(release.artist_name || '');
          const releaseTitle = normalizeForSearch(release.title || '');
          
          // Проверяем совпадение артиста (нечёткое)
          const artistMatch = !normalizedArtist || 
            fuzzyMatch(releaseArtist, normalizedArtist) ||
            fuzzyMatch(normalizedArtist, releaseArtist);
          
          if (artistMatch) {
            const tracks = release.tracks || [];
            console.log(`Checking release "${release.title}" by "${release.artist_name}" with ${tracks.length} tracks:`);
            
            for (let i = 0; i < tracks.length; i++) {
              const trackName = normalizeForSearch(tracks[i]?.title || '');
              console.log(`  - Track ${i}: "${tracks[i]?.title}" (normalized: "${trackName}") vs searching for "${normalizedTitle}"`);
              
              // Точное или нечёткое совпадение названия трека
              if (normalizedTitle && (
                trackName === normalizedTitle ||
                fuzzyMatch(trackName, normalizedTitle) ||
                fuzzyMatch(normalizedTitle, trackName)
              )) {
                console.log(`MATCH by title! Release: ${release.id}, Track: ${tracks[i]?.title}`);
                return {
                  releaseId: release.id,
                  releaseType: 'basic',
                  userId: release.user_id,
                  trackIndex: i,
                  foundBy: 'title'
                };
              }
            }
          }
        }
      }
      
      // В releases_exclusive
      const { data: exclusiveReleases } = await supabaseAdmin
        .from('releases_exclusive')
        .select('id, user_id, tracks, artist_name, title')
        .in('status', ['approved', 'published', 'distributed', 'pending']);
      
      if (exclusiveReleases) {
        for (const release of exclusiveReleases) {
          const releaseArtist = normalizeForSearch(release.artist_name || '');
          
          const artistMatch = !normalizedArtist || 
            fuzzyMatch(releaseArtist, normalizedArtist) ||
            fuzzyMatch(normalizedArtist, releaseArtist);
          
          if (artistMatch) {
            const tracks = release.tracks || [];
            for (let i = 0; i < tracks.length; i++) {
              const trackName = normalizeForSearch(tracks[i]?.title || '');
              
              if (normalizedTitle && (
                trackName === normalizedTitle ||
                fuzzyMatch(trackName, normalizedTitle) ||
                fuzzyMatch(normalizedTitle, trackName)
              )) {
                console.log(`MATCH by title! Release: ${release.id}, Track: ${tracks[i]?.title}`);
                return {
                  releaseId: release.id,
                  releaseType: 'exclusive',
                  userId: release.user_id,
                  trackIndex: i,
                  foundBy: 'title'
                };
              }
            }
          }
        }
      }
    }
    
    // FALLBACK: Ищем по названию РЕЛИЗА (не трека) + артисту
    // Это нужно когда в CSV "Track title" отличается от реального названия трека в базе
    if (releaseTitle && artistName) {
      const normalizedReleaseTitle = normalizeForSearch(releaseTitle);
      const normalizedArtist = normalizeForSearch(artistName);
      
      console.log(`FALLBACK: Searching by RELEASE title: "${normalizedReleaseTitle}" / artist: "${normalizedArtist}"`);
      
      // В releases_basic
      const { data: basicByRelease } = await supabaseAdmin
        .from('releases_basic')
        .select('id, user_id, tracks, artist_name, title')
        .in('status', ['approved', 'published', 'distributed', 'pending']);
      
      if (basicByRelease) {
        for (const release of basicByRelease) {
          const releaseArtist = normalizeForSearch(release.artist_name || '');
          const releaseTitleNorm = normalizeForSearch(release.title || '');
          
          const artistMatch = fuzzyMatch(releaseArtist, normalizedArtist) || 
            fuzzyMatch(normalizedArtist, releaseArtist);
          const titleMatch = fuzzyMatch(releaseTitleNorm, normalizedReleaseTitle) || 
            fuzzyMatch(normalizedReleaseTitle, releaseTitleNorm);
          
          if (artistMatch && titleMatch) {
            console.log(`MATCH by RELEASE title! Release: ${release.id}, Title: ${release.title}`);
            return {
              releaseId: release.id,
              releaseType: 'basic',
              userId: release.user_id,
              trackIndex: 0, // Первый трек
              foundBy: 'release_title'
            };
          }
        }
      }
      
      // В releases_exclusive
      const { data: exclusiveByRelease } = await supabaseAdmin
        .from('releases_exclusive')
        .select('id, user_id, tracks, artist_name, title')
        .in('status', ['approved', 'published', 'distributed', 'pending']);
      
      if (exclusiveByRelease) {
        for (const release of exclusiveByRelease) {
          const releaseArtist = normalizeForSearch(release.artist_name || '');
          const releaseTitleNorm = normalizeForSearch(release.title || '');
          
          const artistMatch = fuzzyMatch(releaseArtist, normalizedArtist) || 
            fuzzyMatch(normalizedArtist, releaseArtist);
          const titleMatch = fuzzyMatch(releaseTitleNorm, normalizedReleaseTitle) || 
            fuzzyMatch(normalizedReleaseTitle, releaseTitleNorm);
          
          if (artistMatch && titleMatch) {
            console.log(`MATCH by RELEASE title! Release: ${release.id}, Title: ${release.title}`);
            return {
              releaseId: release.id,
              releaseType: 'exclusive',
              userId: release.user_id,
              trackIndex: 0,
              foundBy: 'release_title'
            };
          }
        }
      }
    }
    
    return {
      releaseId: null,
      releaseType: null,
      userId: null,
      trackIndex: null,
      foundBy: null
    };
  } catch (error) {
    console.error('Error finding track:', error);
    return {
      releaseId: null,
      releaseType: null,
      userId: null,
      trackIndex: null,
      foundBy: null
    };
  }
}

// Добавляем диагностический эндпоинт для проверки базы
async function debugReleasesData() {
  // Ищем конкретно релизы КВЭЛИК
  const { data: kvelik } = await supabaseAdmin
    .from('releases_basic')
    .select('id, artist_name, title, status, upc, tracks')
    .ilike('artist_name', '%КВЭЛИК%');
  
  const { data: kvelikExclusive } = await supabaseAdmin
    .from('releases_exclusive')
    .select('id, artist_name, title, status, upc, tracks')
    .ilike('artist_name', '%КВЭЛИК%');
  
  console.log('=== DEBUG: КВЭЛИК releases ===');
  console.log('Basic (КВЭЛИК):', kvelik?.map(r => ({
    id: r.id,
    artist: r.artist_name,
    title: r.title,
    status: r.status,
    upc: r.upc,
    tracks: r.tracks?.map((t: any) => ({ title: t.title, isrc: t.isrc }))
  })));
  console.log('Exclusive (КВЭЛИК):', kvelikExclusive?.map(r => ({
    id: r.id,
    artist: r.artist_name,
    title: r.title,
    status: r.status,
    upc: r.upc,
    tracks: r.tracks?.map((t: any) => ({ title: t.title, isrc: t.isrc }))
  })));
  
  // Также ищем по статусу published
  const { data: published } = await supabaseAdmin
    .from('releases_exclusive')
    .select('id, artist_name, title, status, upc, tracks')
    .eq('status', 'published');
  
  console.log('Published exclusive releases:', published?.map(r => ({
    id: r.id,
    artist: r.artist_name,
    title: r.title,
    upc: r.upc,
    tracks: r.tracks?.map((t: any) => ({ title: t.title, isrc: t.isrc }))
  })));
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Проверяем, что пользователь - админ
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Получаем данные формы
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const quarter = formData.get('quarter') as string;
    const year = parseInt(formData.get('year') as string);
    
    if (!files.length || !quarter || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Всегда создаём новый отчёт (не перезаписываем старый)
    const { data: newReport, error: reportError } = await supabaseAdmin
      .from('royalty_reports')
      .insert({
        quarter,
        year,
        status: 'processing',
        total_files: files.length,
        uploaded_by: user.id
      })
      .select()
      .single();
    
    if (reportError) {
      console.error('Error creating report:', reportError);
      return NextResponse.json({ 
        error: `Failed to create report: ${reportError.message}`, 
        details: reportError.message,
        code: reportError.code,
        hint: reportError.hint || 'Убедитесь что таблица royalty_reports создана'
      }, { status: 500 });
    }
    
    const report = newReport;
    
    // ВАЖНО: Читаем файлы в память ДО возврата ответа
    // Пробуем разные кодировки для правильного чтения
    const fileContents: { name: string; content: string }[] = [];
    for (const file of files) {
      try {
        // Читаем как ArrayBuffer для возможности декодирования в разных кодировках
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        
        // Пробуем разные кодировки
        let content = '';
        let bestContent = '';
        
        // 1. UTF-8
        try {
          const decoder = new TextDecoder('utf-8', { fatal: false });
          content = decoder.decode(uint8Array);
          if (!hasGarbageChars(content)) {
            bestContent = content;
            console.log(`File ${file.name}: decoded as UTF-8`);
          }
        } catch (e) {}
        
        // 2. Windows-1251 (кириллица)
        if (!bestContent || hasGarbageChars(bestContent)) {
          try {
            const decoder = new TextDecoder('windows-1251', { fatal: false });
            content = decoder.decode(uint8Array);
            if (!hasGarbageChars(content)) {
              bestContent = content;
              console.log(`File ${file.name}: decoded as Windows-1251`);
            }
          } catch (e) {}
        }
        
        // 3. ISO-8859-1
        if (!bestContent || hasGarbageChars(bestContent)) {
          try {
            const decoder = new TextDecoder('iso-8859-1', { fatal: false });
            content = decoder.decode(uint8Array);
            bestContent = content;
            console.log(`File ${file.name}: decoded as ISO-8859-1`);
          } catch (e) {}
        }
        
        // Используем лучший результат или последний
        fileContents.push({ name: file.name, content: bestContent || content });
      } catch (err) {
        console.error(`Error reading file ${file.name}:`, err);
      }
    }
    
    console.log(`Read ${fileContents.length} files, starting processing...`);
    
    // Обрабатываем файлы асинхронно
    processReportFiles(report.id, fileContents, quarter, year).catch(err => {
      console.error('Processing error:', err);
    });
    
    return NextResponse.json({
      success: true,
      report_id: report.id,
      message: 'Report processing started'
    });
    
  } catch (error) {
    console.error('Error in reports API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Асинхронная обработка файлов
async function processReportFiles(
  reportId: string,
  files: { name: string; content: string }[],
  quarter: string,
  year: number
): Promise<void> {
  console.log(`Starting processReportFiles for ${reportId} with ${files.length} files`);
  
  // Диагностика - показываем что есть в базе
  await debugReleasesData();
  
  const result: ProcessingResult = {
    success: true,
    report_id: reportId,
    stats: {
      totalFiles: files.length,
      processedFiles: 0,
      totalRows: 0,
      matchedTracks: 0,
      unmatchedTracks: 0,
      totalRevenue: 0,
      totalStreams: 0,
      payoutsCreated: 0
    },
    errors: []
  };
  
  // Агрегируем данные по трекам
  const tracksMap = new Map<string, TrackData>();
  
  try {
    for (const file of files) {
      try {
        // Пропускаем summary файлы
        if (file.name.includes('summary')) {
          result.stats.processedFiles++;
          continue;
        }
        
        const content = file.content;
        
        // Логируем начало файла для диагностики кодировки
        console.log(`=== File: ${file.name} ===`);
        console.log('First 500 chars:', content.substring(0, 500));
        
        const rows = parseCSV(content);
        
        console.log(`File ${file.name}: ${rows.length} rows, first row keys:`, rows[0] ? Object.keys(rows[0]) : 'empty');
        
        // Показываем первые 3 строки для проверки декодирования
        if (rows.length > 0) {
          console.log('First 3 rows data:');
          rows.slice(0, 3).forEach((row, idx) => {
            console.log(`Row ${idx}:`, JSON.stringify(row, null, 2));
          });
        }
        
        for (const row of rows) {
          const isrc = row['ISRC'] || '';
          const upc = row['UPC'] || '';
          const trackTitle = row['Track title'] || '';
          const releaseTitle = row['Release title'] || '';
          const artistName = row['Artist Name'] || '';
          const country = row['Country/Region'] || 'Unknown';
          const platform = row['Platform'] || 'Unknown';
          const streams = parseInt(row['Quantity'] || '0') || 0;
          const revenue = parseFloat(row['Net Revenue'] || '0') || 0;
          
          // Логируем первую строку для дебага
          if (result.stats.totalRows === 0) {
            console.log('First CSV row:', { isrc, upc, trackTitle, artistName, releaseTitle, streams, revenue });
          }
          
          // Создаём уникальный ключ для трека
          const trackKey = isrc || `${upc}:${trackTitle}:${artistName}`;
          
          if (!tracksMap.has(trackKey)) {
            tracksMap.set(trackKey, {
              isrc,
              upc,
              trackTitle,
              releaseTitle,
              artistName,
              streams: 0,
              revenue: 0,
              countries: new Map(),
              platforms: new Map()
            });
          }
          
          const trackData = tracksMap.get(trackKey)!;
          trackData.streams += streams;
          trackData.revenue += revenue;
          
          // Агрегируем по странам
          const countryData = trackData.countries.get(country) || { streams: 0, revenue: 0 };
          countryData.streams += streams;
          countryData.revenue += revenue;
          trackData.countries.set(country, countryData);
          
          // Агрегируем по платформам
          const platformData = trackData.platforms.get(platform) || { streams: 0, revenue: 0 };
          platformData.streams += streams;
          platformData.revenue += revenue;
          trackData.platforms.set(platform, platformData);
          
          result.stats.totalRows++;
          result.stats.totalStreams += streams;
          result.stats.totalRevenue += revenue;
        }
        
        result.stats.processedFiles++;
        
        // Обновляем прогресс
        const progress = Math.round((result.stats.processedFiles / files.length) * 50);
        await supabaseAdmin
          .from('royalty_reports')
          .update({ 
            processing_progress: progress,
            processed_files: result.stats.processedFiles,
            total_rows: result.stats.totalRows
          })
          .eq('id', reportId);
          
      } catch (fileError) {
        result.errors.push(`Error processing file ${file.name}: ${fileError}`);
      }
    }
    
    // Сохраняем статистику по трекам и ищем совпадения
    const userPayouts = new Map<string, number>();
    let processedTracks = 0;
    const totalTracks = tracksMap.size;
    
    for (const [trackKey, trackData] of tracksMap) {
      try {
        // Ищем трек в базе
        const match = await findTrackInDatabase(
          trackData.isrc || null,
          trackData.upc || null,
          trackData.trackTitle,
          trackData.artistName,
          trackData.releaseTitle
        );
        
        const isMatched = !!match.releaseId;
        
        console.log(`Track: "${trackData.artistName}" - "${trackData.trackTitle}" (ISRC: ${trackData.isrc}, UPC: ${trackData.upc}) => ${isMatched ? 'MATCHED' : 'NOT FOUND'}`);
        
        if (isMatched) {
          result.stats.matchedTracks++;
          console.log(`  -> Release ID: ${match.releaseId}, User: ${match.userId}, Found by: ${match.foundBy}`);
          
          // Добавляем выплату для пользователя
          if (match.userId) {
            const currentPayout = userPayouts.get(match.userId) || 0;
            userPayouts.set(match.userId, currentPayout + trackData.revenue);
          }
        } else {
          result.stats.unmatchedTracks++;
        }
        
        // Сохраняем статистику трека
        const { data: trackStat, error: trackError } = await supabaseAdmin
          .from('track_statistics')
          .insert({
            report_id: reportId,
            quarter,
            year,
            isrc: trackData.isrc || null,
            upc: trackData.upc || null,
            track_title: trackData.trackTitle,
            release_title: trackData.releaseTitle,
            artist_name: trackData.artistName,
            release_id: match.releaseId,
            release_type: match.releaseType,
            user_id: match.userId,
            track_index: match.trackIndex,
            is_matched: isMatched,
            streams: trackData.streams,
            net_revenue: trackData.revenue
          })
          .select()
          .single();
        
        if (trackError) {
          // Попробуем обновить существующую запись
          await supabaseAdmin
            .from('track_statistics')
            .upsert({
              report_id: reportId,
              quarter,
              year,
              isrc: trackData.isrc || null,
              upc: trackData.upc || null,
              track_title: trackData.trackTitle,
              release_title: trackData.releaseTitle,
              artist_name: trackData.artistName,
              release_id: match.releaseId,
              release_type: match.releaseType,
              user_id: match.userId,
              track_index: match.trackIndex,
              is_matched: isMatched,
              streams: trackData.streams,
              net_revenue: trackData.revenue
            }, {
              onConflict: 'isrc,quarter,year'
            });
        }
        
        // Сохраняем статистику по странам
        if (trackStat) {
          for (const [country, data] of trackData.countries) {
            await supabaseAdmin
              .from('country_statistics')
              .upsert({
                track_stat_id: trackStat.id,
                report_id: reportId,
                country_name: country,
                streams: data.streams,
                net_revenue: data.revenue
              }, { 
                onConflict: 'track_stat_id,country_name',
                ignoreDuplicates: true 
              });
          }
          
          // Сохраняем статистику по платформам
          for (const [platform, data] of trackData.platforms) {
            await supabaseAdmin
              .from('platform_statistics')
              .upsert({
                track_stat_id: trackStat.id,
                report_id: reportId,
                platform_name: platform,
                streams: data.streams,
                net_revenue: data.revenue
              }, { 
                onConflict: 'track_stat_id,platform_name',
                ignoreDuplicates: true 
              });
          }
        }
        
        processedTracks++;
        
        // Обновляем прогресс
        const progress = 50 + Math.round((processedTracks / totalTracks) * 40);
        await supabaseAdmin
          .from('royalty_reports')
          .update({ processing_progress: progress })
          .eq('id', reportId);
          
      } catch (trackError) {
        result.errors.push(`Error saving track ${trackKey}: ${trackError}`);
      }
    }
    
    // Создаём выплаты пользователям и обновляем балансы
    for (const [userId, amount] of userPayouts) {
      try {
        // Получаем текущий баланс из user_balances (новая система)
        let currentBalance = 0;
        const { data: userBalance, error: balanceError } = await supabaseAdmin
          .from('user_balances')
          .select('balance')
          .eq('user_id', userId)
          .single();
        
        if (balanceError && balanceError.code === 'PGRST116') {
          // Нет записи - создаём
          await supabaseAdmin
            .from('user_balances')
            .insert({ user_id: userId, balance: 0 });
          currentBalance = 0;
        } else if (userBalance) {
          currentBalance = parseFloat(userBalance.balance || '0');
        }
        
        const newBalance = currentBalance + amount;
        
        // Создаём запись о выплате
        await supabaseAdmin
          .from('royalty_payouts')
          .insert({
            report_id: reportId,
            user_id: userId,
            quarter,
            year,
            amount,
            status: 'credited'
          });
        
        // Обновляем баланс в ОБЕИХ таблицах (для совместимости)
        // 1. user_balances (новая система - основная)
        await supabaseAdmin
          .from('user_balances')
          .upsert({ 
            user_id: userId, 
            balance: newBalance,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        // 2. profiles (старая система - для совместимости)
        await supabaseAdmin
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);
        
        // Записываем транзакцию для отображения в истории
        const transactionData = {
          user_id: userId,
          type: 'payout',
          amount: amount,
          currency: 'RUB',
          balance_before: currentBalance,
          balance_after: newBalance,
          status: 'completed',
          description: `Роялти за ${quarter} ${year} (отчёт дистрибьютора)`,
          payment_method: 'royalty',
          reference_id: reportId,
          metadata: {
            report_id: reportId,
            quarter: quarter,
            year: year,
            source: 'royalty_report',
            processed_at: new Date().toISOString()
          }
        };
        
        console.log('Creating transaction:', JSON.stringify(transactionData, null, 2));
        
        const { data: txData, error: txError } = await supabaseAdmin
          .from('transactions')
          .insert(transactionData)
          .select()
          .single();
        
        if (txError) {
          console.error('Transaction creation failed:', txError.message, txError.details, txError.hint);
          result.errors.push(`Transaction error for user ${userId}: ${txError.message}`);
        } else {
          console.log('Transaction created successfully:', txData?.id);
        }
        
        console.log(`Payout created for user ${userId}: ${amount} RUB, new balance: ${newBalance}`);
        result.stats.payoutsCreated++;
      } catch (payoutError) {
        console.error(`Error creating payout for user ${userId}:`, payoutError);
        result.errors.push(`Error creating payout for user ${userId}: ${payoutError}`);
      }
    }
    
    // Завершаем обработку
    await supabaseAdmin
      .from('royalty_reports')
      .update({
        status: result.errors.length > 0 ? 'completed' : 'completed',
        processing_progress: 100,
        total_files: result.stats.totalFiles,
        processed_files: result.stats.processedFiles,
        total_rows: result.stats.totalRows,
        matched_tracks: result.stats.matchedTracks,
        unmatched_tracks: result.stats.unmatchedTracks,
        total_revenue: result.stats.totalRevenue,
        total_streams: result.stats.totalStreams,
        error_log: result.errors.length > 0 ? result.errors.join('\n') : null
      })
      .eq('id', reportId);
    
    console.log(`Report ${reportId} processing completed:`, result.stats);
      
  } catch (error) {
    console.error('Error processing report:', error);
    await supabaseAdmin
      .from('royalty_reports')
      .update({
        status: 'failed',
        error_log: `Fatal error: ${error}`
      })
      .eq('id', reportId);
  }
}

// GET - получение списка отчётов или статуса конкретного
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');
    
    if (reportId) {
      // Получаем конкретный отчёт
      const { data: report, error } = await supabaseAdmin
        .from('royalty_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      
      // Проверяем параметр details
      const includeDetails = searchParams.get('details') === 'true';
      
      if (includeDetails && report.status === 'completed') {
        // Получаем детальную статистику по трекам
        const { data: trackStats } = await supabaseAdmin
          .from('track_statistics')
          .select('*')
          .eq('report_id', reportId)
          .order('net_revenue', { ascending: false })
          .limit(50);
        
        // Группируем по релизам
        const releaseMap = new Map<string, {
          releaseId: string | null;
          releaseType?: string;
          releaseTitle: string;
          artistName: string;
          isMatched: boolean;
          totalStreams: number;
          totalRevenue: number;
          coverUrl: string | null;
          tracks: Array<{
            trackTitle: string;
            streams: number;
            revenue: number;
            isrc: string | null;
          }>;
        }>();
        
        for (const stat of trackStats || []) {
          const key = stat.release_id || `unmatched-${stat.release_title}-${stat.artist_name}`;
          const existing = releaseMap.get(key);
          
          if (existing) {
            existing.totalStreams += stat.streams || 0;
            existing.totalRevenue += parseFloat(stat.net_revenue) || 0;
            existing.tracks.push({
              trackTitle: stat.track_title,
              streams: stat.streams || 0,
              revenue: parseFloat(stat.net_revenue) || 0,
              isrc: stat.isrc,
            });
          } else {
            releaseMap.set(key, {
              releaseId: stat.release_id,
              releaseType: stat.release_type,
              releaseTitle: stat.release_title || stat.track_title,
              artistName: stat.artist_name,
              isMatched: stat.is_matched,
              totalStreams: stat.streams || 0,
              totalRevenue: parseFloat(stat.net_revenue) || 0,
              coverUrl: null,
              tracks: [{
                trackTitle: stat.track_title,
                streams: stat.streams || 0,
                revenue: parseFloat(stat.net_revenue) || 0,
                isrc: stat.isrc,
              }],
            });
          }
        }
        
        // Получаем обложки и данные для найденных релизов
        const matchedReleases = Array.from(releaseMap.values())
          .filter(r => r.isMatched && r.releaseId);
        
        const basicReleaseIds = matchedReleases
          .filter(r => r.releaseType === 'basic')
          .map(r => r.releaseId as string);
        const exclusiveReleaseIds = matchedReleases
          .filter(r => r.releaseType === 'exclusive')
          .map(r => r.releaseId as string);
        
        console.log('Basic release IDs for covers:', basicReleaseIds);
        console.log('Exclusive release IDs for covers:', exclusiveReleaseIds);
        
        // Получаем обложки и метаданные из releases_basic
        if (basicReleaseIds.length > 0) {
          const { data: basicData, error: basicError } = await supabaseAdmin
            .from('releases_basic')
            .select('id, cover_url, title, artist_name')
            .in('id', basicReleaseIds);
          
          console.log('Basic releases data for covers:', basicData);
          if (basicError) {
            console.error('Error fetching basic releases covers:', basicError);
          }
          
          for (const release of basicData || []) {
            for (const [key, value] of releaseMap.entries()) {
              if (value.releaseId === release.id) {
                console.log(`Setting coverUrl for ${value.releaseTitle}:`, release.cover_url);
                value.coverUrl = release.cover_url;
                // Обновляем title и artist_name из базы (более надёжные данные чем из CSV)
                if (release.title) value.releaseTitle = release.title;
                if (release.artist_name) value.artistName = release.artist_name;
              }
            }
          }
        }
        
        // Получаем обложки и метаданные из releases_exclusive
        if (exclusiveReleaseIds.length > 0) {
          const { data: exclusiveData, error: exclusiveError } = await supabaseAdmin
            .from('releases_exclusive')
            .select('id, cover_url, title, artist_name')
            .in('id', exclusiveReleaseIds);
          
          console.log('Exclusive releases data for covers:', exclusiveData);
          if (exclusiveError) {
            console.error('Error fetching exclusive releases covers:', exclusiveError);
          }
          
          for (const release of exclusiveData || []) {
            for (const [key, value] of releaseMap.entries()) {
              if (value.releaseId === release.id) {
                console.log(`Setting coverUrl for ${value.releaseTitle}:`, release.cover_url);
                value.coverUrl = release.cover_url;
                // Обновляем title и artist_name из базы (более надёжные данные чем из CSV)
                if (release.title) value.releaseTitle = release.title;
                if (release.artist_name) value.artistName = release.artist_name;
              }
            }
          }
        }
        
        // Получаем статистику по платформам
        const { data: platformStats } = await supabaseAdmin
          .from('platform_statistics')
          .select('platform_name, streams, net_revenue')
          .eq('report_id', reportId);
        
        const platformsMap = new Map<string, { streams: number; revenue: number }>();
        for (const ps of platformStats || []) {
          const existing = platformsMap.get(ps.platform_name) || { streams: 0, revenue: 0 };
          platformsMap.set(ps.platform_name, {
            streams: existing.streams + (ps.streams || 0),
            revenue: existing.revenue + (parseFloat(ps.net_revenue) || 0)
          });
        }
        
        // Получаем статистику по странам (топ-10)
        const { data: countryStats } = await supabaseAdmin
          .from('country_statistics')
          .select('country_name, streams, net_revenue')
          .eq('report_id', reportId);
        
        const countriesMap = new Map<string, { streams: number; revenue: number }>();
        for (const cs of countryStats || []) {
          const existing = countriesMap.get(cs.country_name) || { streams: 0, revenue: 0 };
          countriesMap.set(cs.country_name, {
            streams: existing.streams + (cs.streams || 0),
            revenue: existing.revenue + (parseFloat(cs.net_revenue) || 0)
          });
        }
        
        // Получаем выплаты по пользователям
        const { data: payouts } = await supabaseAdmin
          .from('royalty_payouts')
          .select(`
            user_id,
            amount,
            status,
            profiles!inner(artist_name, avatar_url, email)
          `)
          .eq('report_id', reportId)
          .order('amount', { ascending: false });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userPayouts = (payouts || []).map((p: any) => ({
          userId: p.user_id,
          artistName: p.profiles?.artist_name || 'Неизвестный артист',
          email: p.profiles?.email || '',
          avatarUrl: p.profiles?.avatar_url,
          amount: parseFloat(p.amount) || 0,
          status: p.status
        }));
        
        return NextResponse.json({
          ...report,
          details: {
            releases: Array.from(releaseMap.values())
              .sort((a, b) => b.totalRevenue - a.totalRevenue),
            platforms: Array.from(platformsMap.entries())
              .map(([name, data]) => ({ name, ...data }))
              .sort((a, b) => b.streams - a.streams),
            countries: Array.from(countriesMap.entries())
              .map(([name, data]) => ({ name, ...data }))
              .sort((a, b) => b.streams - a.streams)
              .slice(0, 10),
            payouts: userPayouts
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 10),
          }
        });
      }
      
      return NextResponse.json(report);
    }
    
    // Получаем список всех отчётов
    console.log('Fetching all reports...');
    const { data: reports, error } = await supabaseAdmin
      .from('royalty_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Reports query result:', { count: reports?.length, error: error?.message });
    
    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Returning reports:', reports?.length);
    return NextResponse.json(reports);
    
  } catch (error) {
    console.error('Error in GET reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Удаление отчёта со всей статистикой и выплатами
export async function DELETE(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Проверяем права админа
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }
    
    // Получаем информацию об отчёте для логирования
    const { data: report } = await supabaseAdmin
      .from('royalty_reports')
      .select('quarter, year, total_revenue')
      .eq('id', reportId)
      .single();
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    console.log(`[DELETE REPORT] Удаление отчёта ${report.quarter} ${report.year}, выплаты: ${report.total_revenue}₽`);
    
    // Получаем все track_statistics связанные с отчётом
    const { data: trackStats } = await supabaseAdmin
      .from('track_statistics')
      .select('id')
      .eq('report_id', reportId);
    
    const trackStatIds = trackStats?.map(t => t.id) || [];
    
    // Удаляем связанные данные в правильном порядке (из-за foreign keys)
    
    // 1. Удаляем country_statistics
    if (trackStatIds.length > 0) {
      await supabaseAdmin
        .from('country_statistics')
        .delete()
        .in('track_stat_id', trackStatIds);
    }
    
    // 2. Удаляем platform_statistics
    if (trackStatIds.length > 0) {
      await supabaseAdmin
        .from('platform_statistics')
        .delete()
        .in('track_stat_id', trackStatIds);
    }
    
    // 3. Удаляем track_statistics
    await supabaseAdmin
      .from('track_statistics')
      .delete()
      .eq('report_id', reportId);
    
    // 4. Удаляем royalty_payouts (начисления на балансы пользователей)
    const { data: payouts } = await supabaseAdmin
      .from('royalty_payouts')
      .select('id, user_id, amount')
      .eq('report_id', reportId);
    
    if (payouts && payouts.length > 0) {
      // Отменяем начисления на балансы пользователей
      for (const payout of payouts) {
        // Получаем текущий баланс
        const { data: balanceData } = await supabaseAdmin
          .from('user_balances')
          .select('balance')
          .eq('user_id', payout.user_id)
          .single();
        
        if (balanceData) {
          const newBalance = Math.max(0, balanceData.balance - payout.amount);
          
          // Уменьшаем баланс пользователя
          await supabaseAdmin
            .from('user_balances')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('user_id', payout.user_id);
        }
      }
      
      // Удаляем записи о выплатах
      await supabaseAdmin
        .from('royalty_payouts')
        .delete()
        .eq('report_id', reportId);
    }
    
    // 5. Удаляем транзакции связанные с этим отчётом
    await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('metadata->>report_id', reportId);
    
    // 6. Удаляем сам отчёт
    const { error: deleteError } = await supabaseAdmin
      .from('royalty_reports')
      .delete()
      .eq('id', reportId);
    
    if (deleteError) {
      console.error('Error deleting report:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    console.log(`[DELETE REPORT] Успешно удалён отчёт ${report.quarter} ${report.year}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Отчёт ${report.quarter} ${report.year} удалён`,
      deleted: {
        trackStats: trackStatIds.length,
        payouts: payouts?.length || 0,
        revenue: report.total_revenue
      }
    });
    
  } catch (error) {
    console.error('Error in DELETE report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
