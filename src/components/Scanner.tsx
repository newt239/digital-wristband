import React, { useState, useEffect } from "react";
import { QrReader } from "react-qr-reader";
import { Result } from '@zxing/library';

import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  DialogTitle,
  Switch,
  FormControlLabel,
  Stack,
  DialogContentText,
} from "@mui/material";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import CircularProgress from "@mui/material/CircularProgress";


// https://typescriptbook.jp/reference/statements/unknown
export const isDOMException = (value: unknown): value is DOMException => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const domException = value as DOMException;
  if (typeof domException.name !== "string") {
    return false;
  }
  if (typeof domException.message !== "string") {
    return false;
  }
  return true;
};

export const isAndroid = () => {
  if (navigator.userAgent.match(/Android/)) {
    return true;
  } else {
    return false;
  }
};


type ScannerProps = {
  handleScan: (text: Result) => void;
  camera: boolean;
};

const Scanner: React.VFC<ScannerProps> = ({ handleScan, camera }) => {
  const [scannerStatus, setScannerStatus] = useState<
    "loading" | "waiting" | "error"
  >("loading");
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);

  // out of memory の対策として、2 分 30 秒ごとに react-qr-reader を unmount して、直後に mount している
  // https://github.com/afes-website/cappuccino-app/blob/d0201aa5506e6b3aa7c3cc887171d83b0e773b18/src/components/QRScanner.tsx#L146
  const [refreshQrReader, setRefreshQrReader] = useState(true);
  const interval = isAndroid() ? 30 * 1000 : 2.5 * 60 * 1000;
  useEffect(() => {
    const intervalId = setInterval(() => {
      setScannerStatus("loading");
      setRefreshQrReader(false);
    }, interval);
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  useEffect(() => {
    if (!refreshQrReader) setRefreshQrReader(true);
  }, [refreshQrReader]);

  // https://github.com/afes-website/cappuccino-app/blob/824cf2295cebae85b762b6c7a21cbbe94bf1d0ee/src/components/QRScanner.tsx#L201
  const handleError = (err: unknown) => {
    setScannerStatus("error");
    let reason: string;
    if (isDOMException(err)) {
      switch (err.name) {
        case "NotReadableError":
          reason =
            "カメラが他のアプリケーションで使用されています。カメラアプリやビデオ通話を開いていたり、フラッシュライトが点灯していたりしませんか？";
          break;
        case "NotAllowedError":
          reason =
            "カメラを使用する権限がありません。お使いのブラウザの設定を確認してください。";
          break;
        case "OverconstrainedError":
          reason = "この端末には利用可能なカメラがありません。";
          break;
        default:
          reason = "原因不明のエラーです。" + `[${err.name}] ${err.message}`;
          break;
      }
      setErrorDialogMessage(reason);
    }
  };


  type MessageDialogProps = {
    open: boolean;
    title?: string;
    message: string;
    onClose: () => void;
  };
  const MessageDialog: React.VFC<MessageDialogProps> = (props) => {
    return (
      <Dialog open={props.open} onClose={props.onClose}>
        <DialogTitle
          sx={{
            display: "inline-flex",
            alignItems: "center",
            color: "error.main",
          }}
        >
          <ErrorRoundedIcon />
          {props.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{props.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const Loading: React.VFC = () => {
    return (
      <div
        style={{
          color: "white",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translateY(-50%) translateX(-50%)",
        }}
      >
        <CircularProgress color="inherit" size={64} thickness={6} />
      </div>
    );
  };

  return (
    <Stack>
      <Box
        sx={{
          position: "relative",
          margin: "auto",
          width: "80vw",
          maxWidth: "50vh",
          aspectRatio: "1 / 1",
          backgroundColor: "black",
          borderRadius: `20px`,
        }}
      >
        {refreshQrReader && camera && (
          <div
            style={{
              position: "relative",
            }}
          >
            <QrReader
              onResult={(result, error) => {
                if (result) {
                  handleScan(result);
                }
                if (error) {
                  handleError(error);
                }
              }}
              scanDelay={1}
              constraints={{
                facingMode: "user",
              }}
              className="qrcode"
            />
          </div>
        )}
        {(!refreshQrReader || scannerStatus === "loading") && <Loading />}
      </Box>
      <MessageDialog
        open={errorDialogMessage !== null}
        title="カメラ起動失敗"
        message={errorDialogMessage as string}
        onClose={() => {
          setErrorDialogMessage(null);
        }}
      />
    </Stack>
  );
};

export default Scanner;
