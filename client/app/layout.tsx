import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { CurrencyProvider } from "@/components/CurrencyProvider"; // 1. Import the new provider
import "./globals.css";

// Inter is a beautifully crisp, geometric font that fits our aesthetic
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CricMarket | The Elite Player Analytics Terminal",
  description: "Advanced cricket player valuations and real-time statistics.",
};

// 2. Server-side fetch for live exchange rates based on INR
async function getLiveExchangeRates() {
  try {
    // Fetching rates relative to INR. Cached for 1 hour (3600 seconds)
    const res = await fetch('https://open.er-api.com/v6/latest/INR', {
      next: { revalidate: 3600 }, 
    });
    const data = await res.json();
    return data.rates; 
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    // Safe fallbacks just in case the API goes down
    return { INR: 1, USD: 0.012, GBP: 0.0094, AUD: 0.018 }; 
  }
}

// 3. Make the layout async so we can await the fetch
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // 4. Await the rates before the page renders
  const liveRates = await getLiveExchangeRates();

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-50 antialiased`}>
        {/* 5. Wrap the app and pass down the live rates */}
        <CurrencyProvider initialRates={liveRates}>
          <Navbar />
          {/* The main wrapper limits width to keep stats readable and centered */}
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </CurrencyProvider>
      </body>
    </html>
  );
}