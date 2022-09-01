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
  FormControl,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import CameraswitchRoundedIcon from "@mui/icons-material/CameraswitchRounded";
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
  const getDeviceIdFromStorage = () => {
    const savedCurrentCameraDeviceId = localStorage.getItem(
      "currentCameraDeviceId"
    );
    if (savedCurrentCameraDeviceId) {
      return savedCurrentCameraDeviceId;
    }
    return "";
  };
  const [currentDeviceId, setCurrentDeviceId] = useState<string>(
    getDeviceIdFromStorage()
  );
  const [deviceList, setDeviceList] = useState<{ deviceId: string; label: string; }[]>([]);
  const [selectCameraModalOpen, setSelectCameraModalOpen] =
    useState<boolean>(false);

  const getCameraDeviceList = () => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((mediaDevices) =>
        mediaDevices
          .filter((device) => device.kind === "videoinput")
          .map((device) => {
            return {
              label: device.label,
              deviceId: device.deviceId,
            };
          })
      )
      .then((devices) => {
        setDeviceList(devices);
        if (currentDeviceId === "") {
          setCurrentDeviceId(devices[0].deviceId);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    getCameraDeviceList();
  }, []);

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
  const changeCamera = (event: SelectChangeEvent) => {
    const newCurrentDevice = deviceList.find((v) => {
      if (v.deviceId === event.target.value) {
        return v;
      }
    });
    if (newCurrentDevice) {
      localStorage.setItem("currentCameraDeviceId", newCurrentDevice.deviceId);
      setCurrentDeviceId(newCurrentDevice.deviceId);
      setRefreshQrReader(false);
    }
  };
  const onClickChangeCameraIcon = () => {
    setScannerStatus("loading");
    getCameraDeviceList();
    if (deviceList.length === 2) {
      const newCurrentDevice = deviceList.find((v) => {
        if (v.deviceId !== currentDeviceId) {
          return v;
        }
      });
      if (newCurrentDevice) {
        localStorage.setItem(
          "currentCameraDeviceId",
          newCurrentDevice.deviceId
        );
        setCurrentDeviceId(newCurrentDevice.deviceId);
        setRefreshQrReader(false);
      }
    } else {
      setScannerStatus("waiting");
      setSelectCameraModalOpen(true);
    }
  };

  type MessageDialogProps = {
    open: boolean;
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
          カメラ起動失敗
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
                deviceId: currentDeviceId
              }}
              className="qrcode"
            />
            <IconButton
              onClick={onClickChangeCameraIcon}
              sx={{ position: "absolute", color: "white", top: 0, left: 0 }}
            >
              <CameraswitchRoundedIcon />
            </IconButton>
            <Dialog
              open={selectCameraModalOpen}
              onClose={() => setSelectCameraModalOpen(false)}
            >
              <DialogTitle>カメラ切り替え</DialogTitle>
              <DialogContent>
                <FormControl sx={{ m: 1, minWidth: 200 }}>
                  <Select
                    size="small"
                    value={currentDeviceId}
                    onChange={changeCamera}
                  >
                    {deviceList.map((v) => {
                      return (
                        <MenuItem value={v.deviceId} key={v.deviceId}>
                          {v.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectCameraModalOpen(false)}>
                  閉じる
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        )}
        {(!refreshQrReader || scannerStatus === "loading") && <Loading />}
      </Box>
      <MessageDialog
        open={errorDialogMessage !== null}
        message={errorDialogMessage as string}
        onClose={() => {
          setErrorDialogMessage(null);
        }}
      />
    </Stack >
  );
};

export default Scanner;
