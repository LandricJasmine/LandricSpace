import { Platform } from 'react-native';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

/**
 * 创建跨平台兼容的文件对象，用于 FormData.append()
 * - Web 端返回 File 对象
 * - 移动端返回 { uri, type, name } 对象（RN fetch 会自动处理）
 * @param fileUri Expo 媒体库（如 expo-image-picker、expo-camera）返回的 uri
 * @param fileName 上传时的文件名，如 'photo.jpg'
 * @param mimeType 文件 MIME 类型，如 'image/jpeg'、'audio/mpeg'
 */
export async function createFormDataFile(
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<File | { uri: string; type: string; name: string }> {
  if (Platform.OS === 'web') {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    return new File([blob], fileName, { type: mimeType });
  }
  return { uri: fileUri, type: mimeType, name: fileName };
}

/**
 * 构建文件或图片完整的URL
 * @param url 相对或绝对路径
 * @param w 宽度 (px) - 自动向下取整
 * @param h 高度 (px)
 */
export const buildAssetUrl = (url?: string | null, w?: number, h?: number): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url; // 绝对路径直接返回

  // 1. 去除 Base 尾部和 Path 头部的斜杠
  const base = API_BASE;
  const path = url.replace(/^\//, '');
  const abs = `${base}/${path}`;

  // 2. 无需缩略图则直接返回
  if (!w && !h) return abs;

  // 3. 构造参数，保留原有 Query (如有)
  const separator = abs.includes('?') ? '&' : '?';
  const query = [
    w ? `w=${Math.floor(w)}` : '',
    h ? `h=${Math.floor(h)}` : ''
  ].filter(Boolean).join('&');
  return `${abs}${separator}${query}`;
};

/**
 * 将UTC时间字符串转换为本地时间字符串
 * @param utcDateStr UTC时间字符串，格式如：2025-11-26T01:49:48.009573
 * @returns 本地时间字符串，格式如：2025-11-26 08:49:48
 */
export const convertToLocalTimeStr = (utcDateStr: string): string => {
  if (!utcDateStr) {
    return utcDateStr;
  }
  const microUtcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,6}/;
  if (!microUtcRegex.test(utcDateStr)) {
    console.log('invalid utcDateStr:', utcDateStr);
    return utcDateStr;
  }
  const normalized = utcDateStr.replace(/\.(\d{6})$/, (_, frac) => `.${frac.slice(0, 3)}`);
  const d = dayjs.utc(normalized);
  if (!d.isValid()) {
    return utcDateStr;
  }
  return d.local().format('YYYY-MM-DD HH:mm:ss');
}
