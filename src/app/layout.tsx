import type { Metadata } from "next";
import { Syne, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { cookies } from "next/headers";
import * as jose from "jose";
import { Providers } from "@/components/Providers";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gm | Own Your Social Graph",
  description: "Say GM. Build streaks. Earn reputation. Own your social graph.",
  icons: {
    icon: [{ url: '/app-icon-square.svg', type: 'image/svg+xml' }],
    shortcut: '/app-icon-square.svg',
    apple: '/app-icon-square.svg',
  },
  manifest: '/manifest.json',
  other: {
    "talentapp:project_verification": "5fe4a4a6b2e2883341806ae777a787c8b6ba28c5bb5ce5dca7df48a40a6ec9fcbcfcb7976960fef765b210965dfa0c98bf527a2cb453bc6f2abe28632aaaca3a",
  },
};

import { getServiceRoleClient } from "@/lib/supabase";

async function getInitialSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("gm_session_token")?.value;
    
    if (!token || !process.env.LOCAL_SESSION_SECRET) return null;

    const secret = new TextEncoder().encode(process.env.LOCAL_SESSION_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const address = payload.address as string;

    const supabase = getServiceRoleClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('address', address)
      .maybeSingle();
    
    return {
      address,
      username: profile?.username || null,
      avatar: profile?.avatar_url || null
    };
  } catch (error) {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getInitialSession();

  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-black text-white" suppressHydrationWarning>
        <Providers initialUser={initialUser}>
          {children}
        </Providers>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0A0A0A',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '1rem',
              fontSize: '13px',
              fontFamily: 'var(--font-inter)',
            },
          }}
        />
      </body>
    </html>
  );
}
