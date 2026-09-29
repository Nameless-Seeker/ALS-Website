import { Link, useLocation } from "react-router-dom"
import { Activity, Sun, Moon, AudioWaveform, Info, Mic } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { ServerStatus } from "@/components/ServerStatus"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <AudioWaveform className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight font-extrabold text-foreground">ALS Speech Assist</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Torgo Whisper ASR
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === "/"
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Activity className="w-4 h-4" />
              Transcribe
            </Link>
            <Link
              to="/live-talk"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === "/live-talk"
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Mic className="w-4 h-4" />
              Live Talk
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded bg-primary/15 text-primary">
                MIC
              </span>
            </Link>
            <Link
              to="/about"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === "/about"
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Info className="w-4 h-4" />
              About & Model
            </Link>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <ServerStatus />

          {/* Theme Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
