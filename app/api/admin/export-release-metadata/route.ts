import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

// Инициализируем Supabase клиент с service role ключом
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Получаем параметры из URL
    const searchParams = request.nextUrl.searchParams;
    const releaseId = searchParams.get('releaseId');
    const releaseType = searchParams.get('releaseType') as 'basic' | 'exclusive';

    if (!releaseId || !releaseType) {
      return NextResponse.json(
        { error: 'releaseId и releaseType обязательны' },
        { status: 400 }
      );
    }

    // Создаем клиент с service role для доступа к данным
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Получаем данные релиза
    const tableName = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
    const { data: release, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', releaseId)
      .single();

    if (error || !release) {
      return NextResponse.json(
        { error: 'Релиз не найден' },
        { status: 404 }
      );
    }

    // Создаем Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Metadata');

    // Настройка стилей
    const headerStyle = {
      font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4A90E2' } },
      alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };

    const cellStyle = {
      alignment: { vertical: 'middle' as const, horizontal: 'left' as const, wrapText: true },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };

    // Заголовки колонок
    worksheet.columns = [
      { header: 'Catalog Number', key: 'catalog_number', width: 20 },
      { header: 'Track Number', key: 'track_number', width: 15 },
      { header: 'Filename', key: 'filename', width: 40 },
      { header: 'Track Title', key: 'track_title', width: 30 },
      { header: 'Version', key: 'version', width: 20 },
      { header: 'Artist', key: 'artist', width: 30 },
      { header: 'Producer', key: 'producer', width: 30 },
      { header: 'Featuring', key: 'featuring', width: 30 },
      { header: 'ISRC', key: 'isrc', width: 20 },
      { header: 'Language', key: 'language', width: 15 },
      { header: 'Explicit', key: 'explicit', width: 12 },
      { header: 'Instrumental', key: 'instrumental', width: 15 }
    ];

    // Применяем стили к заголовкам
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell: any) => {
      cell.style = headerStyle;
    });
    headerRow.height = 25;

    // Парсим треки
    const tracks = Array.isArray(release.tracks) ? release.tracks : [];

    // Добавляем данные треков
    tracks.forEach((track: any, index: number) => {
      const trackNumber = String(index + 1).padStart(2, '0');
      const filename = `${trackNumber}_${sanitizeFilename(release.artist_name)}_${sanitizeFilename(track.title)}.wav`;

      // Обрабатываем массивы продюсеров и фичеринга
      const producers = Array.isArray(track.producers) 
        ? track.producers.join(', ') 
        : (track.producer || track.producers || '');
      const featuring = Array.isArray(track.featuring) 
        ? track.featuring.join(', ') 
        : (track.featuring || '');
      
      // Определяем Explicit контент
      const isExplicit = track.explicit || track.hasDrugs || false;
      
      // Version (версия трека)
      const version = track.version || '';

      const row = worksheet.addRow({
        catalog_number: release.catalog_number || 'N/A',
        track_number: trackNumber,
        filename: filename,
        track_title: track.title || '',
        version: version,
        artist: release.artist_name || '',
        producer: producers,
        featuring: featuring,
        isrc: track.isrc || '',
        language: track.language || '',
        explicit: isExplicit ? 'Yes' : 'No',
        instrumental: !track.lyrics ? 'Yes' : 'No' // Если нет текста - инструментал
      });

      // Применяем стили к ячейкам
      row.eachCell((cell: any) => {
        cell.style = cellStyle;
      });
      row.height = 20;
    });

    // Добавляем секцию с общей информацией о релизе
    worksheet.addRow([]);
    worksheet.addRow([]);
    const infoHeaderRow = worksheet.addRow(['RELEASE INFORMATION']);
    infoHeaderRow.getCell(1).style = headerStyle;
    worksheet.mergeCells(`A${infoHeaderRow.number}:L${infoHeaderRow.number}`);

    const releaseInfo = [
      ['Title:', release.title],
      ['Artist:', release.artist_name],
      ['Catalog Number:', release.catalog_number || 'N/A'],
      ['UPC:', release.upc || 'N/A'],
      ['Genre:', release.genre],
      ['Subgenres:', Array.isArray(release.subgenres) ? release.subgenres.join(', ') : (release.subgenres || 'N/A')],
      ['Release Date:', release.release_date || 'N/A'],
      ['Collaborators:', Array.isArray(release.collaborators) ? release.collaborators.join(', ') : (release.collaborators || 'N/A')],
      ['Platforms:', Array.isArray(release.platforms) ? release.platforms.join(', ') : (release.platforms || 'N/A')],
      ['Countries:', Array.isArray(release.countries) ? release.countries.join(', ') : (release.countries || 'N/A')],
      ['Type:', releaseType === 'basic' ? 'Basic (Paid)' : 'Exclusive (Free)'],
      ['Status:', release.status],
      ['Payment Status:', release.payment_status || 'N/A'],
    ];

    releaseInfo.forEach(([label, value]) => {
      const row = worksheet.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      row.getCell(1).style = cellStyle;
      row.getCell(2).style = cellStyle;
    });

    // Генерируем файл
    const buffer = await workbook.xlsx.writeBuffer();

    // Формируем имя файла в формате: Artist Name - Release Title (thqrel-XXXX).xlsx
    const sanitizedTitle = sanitizeFilename(release.title);
    const sanitizedArtist = sanitizeFilename(release.artist_name);
    const customIdPart = release.custom_id ? ` (${release.custom_id})` : (release.catalog_number ? ` (${release.catalog_number})` : '');
    const filename = `${sanitizedArtist} - ${sanitizedTitle}${customIdPart}.xlsx`;

    // Возвращаем файл
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json(
      { error: 'Ошибка при генерации Excel файла' },
      { status: 500 }
    );
  }
}

// Функция для санитизации имени файла
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s-]/g, '') // Удаляем специальные символы
    .replace(/\s+/g, '_')     // Заменяем пробелы на подчеркивания
    .replace(/-+/g, '-')      // Удаляем повторяющиеся дефисы
    .trim();
}
