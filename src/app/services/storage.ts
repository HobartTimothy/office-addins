// 仅演示用途：简单 Base64“加密”，生产环境请使用安全后端和 KMS / Secrets Manager

const STORAGE_KEY = "aws-s3-addin-config";

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
}

function encode(data: string): string {
  return window.btoa(unescape(encodeURIComponent(data)));
}

function decode(data: string): string {
  return decodeURIComponent(escape(window.atob(data)));
}

export function saveConfig(config: S3Config): void {
  const json = JSON.stringify(config);
  const cipher = encode(json);
  window.localStorage.setItem(STORAGE_KEY, cipher);
}

export function loadConfig(): S3Config | null {
  const cipher = window.localStorage.getItem(STORAGE_KEY);
  if (!cipher) return null;
  try {
    const json = decode(cipher);
    return JSON.parse(json) as S3Config;
  } catch {
    return null;
  }
}

export function clearConfig(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}


