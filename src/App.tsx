import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/context/ThemeContext"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { TranscribePage } from "@/pages/TranscribePage"
import { LiveTalkPage } from "@/pages/LiveTalkPage"
import { AboutPage } from "@/pages/AboutPage"

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<TranscribePage />} />
              <Route path="/live-talk" element={<LiveTalkPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  )
}
