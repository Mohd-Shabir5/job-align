import "./globals.css";

export const metadata = {
  title: "JobAlign AI · Job Search & CV Optimizer",
  description:
    "AI-powered job search, CV optimization, and smart matching. Powered by Google Gemini. Search jobs, optimize your CV for ATS, and find your best career matches.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
