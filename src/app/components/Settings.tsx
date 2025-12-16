import React, { useState, useEffect, useCallback } from "react";
import {
  TextField,
  PrimaryButton,
  DefaultButton,
  Stack,
  MessageBar,
  MessageBarType,
  Spinner,
  Label,
} from "@fluentui/react";
import { loadConfig, saveConfig, clearConfig, S3Config } from "../services/storage";
import { testConnection } from "../services/S3Service";

interface Props {
  onConfigSaved?: (config: S3Config | null) => void;
}

const Settings: React.FC<Props> = ({ onConfigSaved }) => {
  const [form, setForm] = useState<S3Config>({
    accessKeyId: "",
    secretAccessKey: "",
    bucketName: "",
    region: "us-east-1",
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageBarType | undefined>();

  useEffect(() => {
    const cfg = loadConfig();
    if (cfg) {
      setForm(cfg);
    }
  }, []);

  const handleChange = (
    ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string
  ) => {
    const name = (ev.target as HTMLInputElement).name as keyof S3Config;
    setForm((prev) => ({
      ...prev,
      [name]: value ?? "",
    }));
  };

  const handleSave = useCallback(() => {
    setLoading(true);
    try {
      saveConfig(form);
      setMessageType(MessageBarType.success);
      setMessage("配置已保存（仅本机浏览器 LocalStorage，演示用途）");
      onConfigSaved?.(form);
    } catch (e: any) {
      setMessageType(MessageBarType.error);
      setMessage(`保存失败: ${e.message || e.toString()}`);
    } finally {
      setLoading(false);
    }
  }, [form, onConfigSaved]);

  const handleClear = useCallback(() => {
    clearConfig();
    setForm({
      accessKeyId: "",
      secretAccessKey: "",
      bucketName: "",
      region: "us-east-1",
    });
    onConfigSaved?.(null);
    setMessageType(MessageBarType.info);
    setMessage("本地配置已清除");
  }, [onConfigSaved]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setMessage(null);
    try {
      await testConnection(form);
      setMessageType(MessageBarType.success);
      setMessage("连接成功：已成功访问 S3 Bucket。");
    } catch (e: any) {
      setMessageType(MessageBarType.error);
      setMessage(`连接失败: ${e.message || e.toString()}`);
    } finally {
      setTesting(false);
    }
  }, [form]);

  return (
    <Stack tokens={{ childrenGap: 12 }}>
      {message && (
        <MessageBar
          messageBarType={messageType}
          onDismiss={() => setMessage(null)}
          isMultiline={false}
        >
          {message}
        </MessageBar>
      )}

      <Label>AWS S3 凭据（仅演示用途，请勿用于生产环境）</Label>

      <TextField
        label="Access Key ID"
        name="accessKeyId"
        value={form.accessKeyId}
        onChange={handleChange}
        placeholder="AKIA..."
      />
      <TextField
        label="Secret Access Key"
        name="secretAccessKey"
        value={form.secretAccessKey}
        onChange={handleChange}
        type="password"
      />
      <TextField
        label="Bucket Name"
        name="bucketName"
        value={form.bucketName}
        onChange={handleChange}
      />
      <TextField
        label="Region"
        name="region"
        value={form.region}
        onChange={handleChange}
        placeholder="例如：us-east-1, ap-northeast-1"
      />

      <Stack horizontal tokens={{ childrenGap: 8 }}>
        <PrimaryButton text="保存配置" onClick={handleSave} disabled={loading || testing} />
        <DefaultButton text="测试连接" onClick={handleTest} disabled={loading || testing} />
        <DefaultButton text="清除配置" onClick={handleClear} disabled={loading || testing} />
      </Stack>

      {(loading || testing) && (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Spinner label={loading ? "正在保存..." : "正在测试连接..."} />
        </Stack>
      )}
    </Stack>
  );
};

export default Settings;


