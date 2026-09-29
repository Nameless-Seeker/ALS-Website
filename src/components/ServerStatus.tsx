import { useEffect, useState } from "react"
import { checkBackendHealth, type HealthResponse } from "@/services/api"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react"

// Module-level cache so health check runs strictly ONCE per website session
let hasCheckedOnce = false
let cachedStatus: "checking" | "online" | "offline" = "checking"
let cachedHealthData: HealthResponse | null = null

export function ServerStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">(cachedStatus)
  const [healthData, setHealthData] = useState<HealthResponse | null>(cachedHealthData)

  const performCheck = async () => {
    setStatus("checking")
    try {
      const data = await checkBackendHealth()
      cachedStatus = "online"
      cachedHealthData = data
      setStatus("online")
      setHealthData(data)
    } catch {
      cachedStatus = "offline"
      cachedHealthData = null
      setStatus("offline")
      setHealthData(null)
    }
  }

  useEffect(() => {
    // Only perform the check ONCE when the website is opened.
    // For all route changes and subsequent renders, do not check again.
    if (!hasCheckedOnce) {
      hasCheckedOnce = true
      performCheck()
    }
  }, [])

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "checking" && (
        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-background">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span>Connecting...</span>
        </Badge>
      )}

      {status === "online" && (
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1.5 py-1 px-2.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>System Online</span>
          </Badge>
          {healthData?.model && (
            <span className="hidden md:inline-block font-mono text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
              Model: {healthData.model}
            </span>
          )}
        </div>
      )}

      {status === "offline" && (
        <div className="flex items-center gap-1.5">
          <Badge variant="destructive" className="gap-1.5 py-1 px-2.5">
            <XCircle className="w-3 h-3" />
            <span>System Offline</span>
          </Badge>
          <button
            type="button"
            onClick={performCheck}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Retry connection"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
