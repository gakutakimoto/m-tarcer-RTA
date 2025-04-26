import "./globals.css";
import { Oswald } from "next/font/google";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body
        className={`bg-bg text-white font-oswald antialiased ${oswald.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
