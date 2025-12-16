import React, { useEffect, useState, useCallback } from "react";
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  PrimaryButton,
  Stack,
  MessageBar,
  MessageBarType,
  Spinner,
  Link,
} from "@fluentui/react";
import { loadConfig, S3Config } from "../services/storage";
import { listFiles, getFile, S3FileObject } from "../services/S3Service";

interface FileWithActions extends S3FileObject {
  id: string;
}

const FileList: React.FC = () => {
  const [config, setConfig] = useState<S3Config | null>(null);
  const [files, setFiles] = useState<FileWithActions[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [inserting, setInserting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageBarType | undefined>();

  useEffect(() => {
    const cfg = loadConfig();
    setConfig(cfg);
  }, []);

  const loadPage = useCallback(
    async (token?: string) => {
      if (!config) {
        setMessageType(MessageBarType.warning);
        setMessage("请先在设置页配置并保存 S3 参数。");
        return;
      }
      setLoading(true);
      setMessage(null);
      try {
        const res = await listFiles(config, token);
        const newFiles: FileWithActions[] = res.files.map((f, index) => ({
          ...f,
          id: `${f.key}-${token || "first"}-${index}`,
        }));
        if (token) {
          setFiles((prev) => [...prev, ...newFiles]);
        } else {
          setFiles(newFiles);
        }
        setNextToken(res.nextContinuationToken);
      } catch (e: any) {
        setMessageType(MessageBarType.error);
        setMessage(`获取文件列表失败: ${e.message || e.toString()}`);
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  useEffect(() => {
    // 初次加载
    loadPage();
  }, [loadPage]);

  const handleInsert = useCallback(
    async (file: FileWithActions) => {
      if (!config) {
        setMessageType(MessageBarType.warning);
        setMessage("请先在设置页配置并保存 S3 参数。");
        return;
      }
      setInserting(file.id);
      setMessage(null);
      try {
        const result = await getFile(config, file.key);

        if (result.isTextLike && result.textContent) {
          await new Promise<void>((resolve, reject) => {
            Office.context.document.setSelectedDataAsync(
              result.textContent!,
              { coercionType: Office.CoercionType.Text },
              (asyncResult) => {
                if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                  resolve();
                } else {
                  reject(asyncResult.error);
                }
              }
            );
          });
          setMessageType(MessageBarType.success);
          setMessage(`文件 "${file.key}" 已插入到文档光标处。`);
        } else if (result.blob) {
          const url = URL.createObjectURL(result.blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.key.split("/").pop() || "download";
          a.click();
          URL.revokeObjectURL(url);
          setMessageType(MessageBarType.info);
          setMessage(`文件 "${file.key}" 已开始下载（浏览器保存为本地文件）。`);
        } else {
          setMessageType(MessageBarType.warning);
          setMessage(`无法处理文件 "${file.key}" 的内容。`);
        }
      } catch (e: any) {
        setMessageType(MessageBarType.error);
        setMessage(`插入/下载失败: ${e.message || e.toString()}`);
      } finally {
        setInserting(null);
      }
    },
    [config]
  );

  const columns: IColumn[] = [
    {
      key: "columnName",
      name: "文件名",
      fieldName: "key",
      minWidth: 160,
      isResizable: true,
      onRender: (item: FileWithActions) => <span title={item.key}>{item.key}</span>,
    },
    {
      key: "columnLastModified",
      name: "最后修改时间",
      fieldName: "lastModified",
      minWidth: 120,
      isResizable: true,
      onRender: (item: FileWithActions) =>
        item.lastModified ? item.lastModified.toLocaleString() : "-",
    },
    {
      key: "columnSize",
      name: "大小 (Bytes)",
      fieldName: "size",
      minWidth: 80,
      isResizable: true,
      onRender: (item: FileWithActions) => (item.size != null ? item.size.toString() : "-"),
    },
    {
      key: "columnActions",
      name: "操作",
      minWidth: 100,
      onRender: (item: FileWithActions) => (
        <PrimaryButton
          text="恢复/插入"
          onClick={() => handleInsert(item)}
          disabled={!!inserting}
        />
      ),
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      {message && (
        <MessageBar
          messageBarType={messageType}
          onDismiss={() => setMessage(null)}
          isMultiline={false}
        >
          {message}
        </MessageBar>
      )}

      {!config && (
        <MessageBar messageBarType={MessageBarType.warning} isMultiline={false}>
          当前尚未配置 S3 连接信息，请先在“设置”页完成配置并保存。
        </MessageBar>
      )}

      <DetailsList
        items={files}
        columns={columns}
        selectionMode={SelectionMode.none}
        layoutMode={DetailsListLayoutMode.justified}
        isHeaderVisible={true}
        compact={true}
      />

      {loading && (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Spinner label="正在加载文件列表..." />
        </Stack>
      )}

      {nextToken && !loading && (
        <Stack horizontal horizontalAlign="center">
          <Link onClick={() => loadPage(nextToken)}>加载更多...</Link>
        </Stack>
      )}

      {inserting && (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Spinner label="正在恢复/插入文件内容..." />
        </Stack>
      )}
    </Stack>
  );
};

export default FileList;


