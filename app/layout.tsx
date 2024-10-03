import "@mantine/core/styles.css";
import "./globals.css"

import { ColorSchemeScript, MantineProvider } from "@mantine/core";

export const metadata = {
  title: "VideoDubber.ai - Technical Assignment",
  description: "Made by - Kanishaka Pranjal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider >{children}</MantineProvider>
      </body>
    </html>
  );
}
