/**
 * IMAGE OPTIMIZER - Сжатие обложек для быстрой загрузки
 * 
 * Стратегия:
 * 1. Сохраняем ОРИГИНАЛ (cover_url_original) - для админа
 * 2. Создаём СЖАТУЮ версию (cover_url) - для отображения везде
 * 3. Сжатие: WebP формат, качество 85%, размер 800x800
 * 4. Экономия трафика до 90% без видимой потери качества
 */

// Размеры для сжатия
const COMPRESSED_SIZE = 800; // 800x800 для отображения
const QUALITY = 0.85; // 85% качество WebP

/**
 * Сжимает изображение в WebP формат
 * @param file - Оригинальный файл изображения
 * @param maxSize - Максимальный размер стороны
 * @param quality - Качество сжатия (0-1)
 * @returns Promise<Blob> - Сжатое изображение
 */
export async function compressImage(
  file: File,
  maxSize: number = COMPRESSED_SIZE,
  quality: number = QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Вычисляем новый размер (сохраняем пропорции)
      let width = img.width;
      let height = img.height;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      
      // Создаём canvas для сжатия
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // Высококачественный ресайз
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Конвертируем в WebP (или JPEG если WebP не поддерживается)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback на JPEG
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve(jpegBlob);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Создаёт thumbnail для быстрой загрузки
 * @param file - Оригинальный файл
 * @returns Promise<Blob> - Маленький thumbnail
 */
export async function createThumbnail(file: File): Promise<Blob> {
  return compressImage(file, 200, 0.7); // 200x200, качество 70%
}

/**
 * Проверяет поддержку WebP в браузере
 */
export function supportsWebP(): boolean {
  if (typeof document === 'undefined') return true;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Получает размер файла в читаемом формате
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const imageOptimizer = {
  compressImage,
  createThumbnail,
  supportsWebP,
  formatFileSize,
};

export default imageOptimizer;
