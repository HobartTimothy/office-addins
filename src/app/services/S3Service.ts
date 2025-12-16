import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  ListObjectsV2CommandInput,
} from "@aws-sdk/client-s3";
import type { S3Config } from "./storage";

export interface S3FileObject {
  key: string;
  lastModified?: Date;
  size?: number;
}

export interface ListResult {
  files: S3FileObject[];
  nextContinuationToken?: string;
}

function createClient(config: S3Config): S3Client {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function testConnection(config: S3Config): Promise<void> {
  const client = createClient(config);
  const input: ListObjectsV2CommandInput = {
    Bucket: config.bucketName,
    MaxKeys: 1,
  };
  await client.send(new ListObjectsV2Command(input));
}

export async function listFiles(
  config: S3Config,
  continuationToken?: string,
  pageSize: number = 50
): Promise<ListResult> {
  const client = createClient(config);
  const input: ListObjectsV2CommandInput = {
    Bucket: config.bucketName,
    MaxKeys: pageSize,
    ContinuationToken: continuationToken,
  };

  const resp = await client.send(new ListObjectsV2Command(input));
  const files: S3FileObject[] =
    resp.Contents?.map((o) => ({
      key: o.Key || "",
      lastModified: o.LastModified,
      size: o.Size,
    })).filter((f) => !!f.key) ?? [];

  return {
    files,
    nextContinuationToken: resp.NextContinuationToken,
  };
}

// 将 GetObject 的 Body 转为文本
async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode();
  return result;
}

export interface GetObjectResult {
  textContent?: string;
  blob?: Blob;
  contentType?: string;
  isTextLike: boolean;
}

const TEXT_LIKE_CONTENT_TYPES = [
  "text/plain",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function getFile(
  config: S3Config,
  key: string
): Promise<GetObjectResult> {
  const client = createClient(config);
  const cmd = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  const resp = await client.send(cmd);
  const contentType = resp.ContentType || "application/octet-stream";

  const body = resp.Body;
  if (!body) {
    throw new Error("Empty object body");
  }

  const anyBody: any = body as any;
  const bodyStream: ReadableStream<Uint8Array> | null =
    body instanceof ReadableStream
      ? body
      : anyBody.transformToWebStream
      ? anyBody.transformToWebStream()
      : null;

  const isTextLike =
    TEXT_LIKE_CONTENT_TYPES.some((t) => contentType.startsWith(t)) ||
    contentType.startsWith("text/");

  if (bodyStream) {
    if (isTextLike) {
      const textContent = await streamToString(bodyStream);
      return { textContent, contentType, isTextLike: true };
    }

    // 非文本：读成 Blob 返回
    const reader = bodyStream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const blob = new Blob(chunks, { type: contentType });
    return { blob, contentType, isTextLike: false };
  }

  // 没有 stream 的情况，退回 Blob
  const blob = body as unknown as Blob;
  if (isTextLike) {
    const textContent = await blob.text();
    return { textContent, contentType, isTextLike: true };
  }
  return { blob, contentType, isTextLike: false };
}


