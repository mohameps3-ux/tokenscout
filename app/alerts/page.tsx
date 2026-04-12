import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { AlertsManager } from "@/components/alerts/AlertsManager";

export const metadata: Metadata = {
  title: "Telegram Alerts | TokenScout",
  description: "Configure custom token alerts sent directly to your Telegram.",
};

export default function AlertsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Telegram Alerts</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Get notified on Telegram when a token matches your custom criteria.
          </p>
        </div>

        {/* How to get Chat ID */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
          <p className="text-sm font-semibold text-white">How it works</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-400">
            <li>
              Open{" "}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                @userinfobot
              </a>{" "}
              on Telegram and send any message to get your Chat ID.
            </li>
            <li>Create a rule below with your Chat ID and your filter criteria.</li>
            <li>TokenScout sends a formatted alert when a matching token is discovered.</li>
          </ol>
        </div>

        <AlertsManager />
      </main>
    </div>
  );
}
