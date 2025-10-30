import Header from "../shared/widgets/header";
import "./global.css";
import { Poppins, Roboto } from "next/font/google";
import Provider from "./provider";
import { Toaster } from "react-hot-toast";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "UniLoop",
  description: "UniLoop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${poppins.variable} bg-[#ececec] antialiased`}>
        <Toaster position="top-right" reverseOrder={false} />
        <Provider>
          <Header />
          {children}
        </Provider>
      </body>
    </html>
  );
}
