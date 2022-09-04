import React, { useState } from 'react';
import ReactGA from "react-ga4";
import QRCode from "react-qr-code";
import { Result } from '@zxing/library';

import { Container, Grid, Typography, Alert, Box, Collapse, IconButton, useTheme, Button } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';

import { ColorModeContext } from './App';
import Scanner from './Scanner';

const Body: React.VFC = () => {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);
  const [camera, setCamera] = useState<"waiting" | "success" | "error">("waiting");
  const [invalid, setInvalid] = useState<boolean>(false);
  const [guestId, setGuestId] = useState<string>(localStorage.getItem("guest_id") || "example");

  const guestIdValidation = (guest_id: string) => {
    if (guest_id.length === 10) {
      if (guest_id.startsWith("G")) {
        const guestIdNumberList = Array.from(guest_id.slice(1)).map((nstr) =>
          Number(nstr)
        );
        const sumStr = String(
          guestIdNumberList.slice(0, 8).reduce((sum, n) => {
            return sum + n;
          }, 0)
        );
        const onesPlaceOfSum = Number(sumStr[sumStr.length - 1]);
        const checkSum = guestIdNumberList[guestIdNumberList.length - 1];
        if (onesPlaceOfSum === checkSum) {
          return true;
        }
      }
    }
    return false;
  };

  const handleScan = (data: Result) => {
    const text = data.getText();
    console.log(text);
    if (guestIdValidation(text)) {
      setCamera("success");
      setGuestId(text);
      localStorage.setItem("guest_id", text);
      ReactGA.event({
        category: "scan_qr",
        action: "guest_id",
        label: text,
      });
    } else {
      setInvalid(true);
      ReactGA.event({
        category: "scan_qr",
        action: "no_guest_id",
        label: text,
      });
    }
  };

  return (
    <Container sx={{ minHeight: "100vh", bgcolor: 'background.default', color: 'text.primary' }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h1" sx={{ fontWeight: 900, fontSize: "2rem", fontFamily: "Montserrat", textAlign: "center", my: 2 }}>
            <span style={{ display: "inline-block", paddingRight: "1rem" }}>Gateway </span>
            <span style={{ display: "inline-block" }}>Digital Wristband</span>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Collapse orientation="vertical" in={camera === "waiting"} collapsedSize={0} timeout={1000}>
            <Alert severity={invalid ? "error" : "info"}>
              {invalid && "スキャン結果がゲストIDの形式と一致しません。再度"}
              お手元のリストバンドをスキャンしてください。
            </Alert>
            <Box sx={{ my: 2 }}>
              <Scanner handleScan={handleScan} camera={camera === "waiting"} />
            </Box>
          </Collapse>
          <Collapse orientation="vertical" in={camera === "success"} collapsedSize={0} timeout={1000} sx={{ textAlign: "center" }}>
            <Alert severity="info">
              展示入退室時に以下のQRコードをご提示ください。
            </Alert>
            <Box sx={{ textAlign: "center", m: 2 }}>
              <QRCode
                value={guestId}
                level='H'
                bgColor={theme.palette.mode === "dark" ? "#212121" : "white"}
                fgColor={theme.palette.mode === "dark" ? "white" : "black"}
              />
            </Box>
            <Typography variant="h2" sx={{
              fontSize: "2rem",
              fontFamily: "Montserrat",
              textAlign: "center",
              borderBottom: "1px solid",
              borderBottomColor: "text.primary",
              py: 2,
            }}>
              {guestId?.slice(1, 4)} {guestId?.slice(4, 7)} {guestId?.slice(7, 10)}
            </Typography>
            <Box sx={{ mt: 2, mb: "50vh" }}>
              <Button variant="text" startIcon={<ReplayRoundedIcon />} onClick={() => {
                setInvalid(false);
                setCamera("waiting");
                localStorage.removeItem("guest_id");
              }}>最初からやり直す</Button>
            </Box>
          </Collapse>
        </Grid>
      </Grid>
      <Box sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        p: 1,
        textAlign: "center",
        bgcolor: 'background.default',
        color: 'text.primary',
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
      }}>
        <Typography variant="body2">© 2022 栄東祭実行委員会 技術部</Typography>
        <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
    </Container >
  );
}

export default Body;
