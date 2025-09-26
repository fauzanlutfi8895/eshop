import Header from "../shared/widgets/header";
import "./global.css";
import { Poppins, Roboto } from "next/font/google";
import Provider from "./provider";

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
      <body className={`${roboto.variable} ${poppins.variable} bg-[#ececec]`}>
        <Provider>
          <Header />
          {children}
        </Provider>
      </body>
    </html>
  );
}
