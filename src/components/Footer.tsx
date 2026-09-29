export function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-8">
        <div>
          ALS Speech Assist &bull; Built with React, Vite, Tailwind CSS &amp; shadcn/ui
        </div>
        <div className="text-[11px]">
          AI-Powered Dysarthric Speech Recognition &amp; Voice Synthesis
        </div>
      </div>
    </footer>
  )
}
