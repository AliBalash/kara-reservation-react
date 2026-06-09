import { DatesProvider } from "@mantine/dates";
import { DirectionProvider, MantineProvider, createTheme } from "@mantine/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "dayjs/locale/fa";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import App from "./App.jsx";

const theme = createTheme({
  primaryColor: "kara",
  defaultRadius: "md",
  fontFamily: '"Vazirmatn", "Tahoma", sans-serif',
  headings: {
    fontFamily: '"Space Grotesk", "Vazirmatn", sans-serif',
  },
  colors: {
    kara: [
      "#fff1f1",
      "#ffe1e1",
      "#ffc9c9",
      "#ffa2a2",
      "#ff7676",
      "#ef4f4f",
      "#dd3333",
      "#c81921",
      "#a90f17",
      "#87060f",
    ],
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DirectionProvider initialDirection="rtl">
      <MantineProvider theme={theme} forceColorScheme="light">
        <DatesProvider settings={{ locale: "fa", firstDayOfWeek: 6 }}>
          <App />
        </DatesProvider>
      </MantineProvider>
    </DirectionProvider>
  </StrictMode>,
)
