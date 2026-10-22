import React, { useEffect, useState } from "react"
import { ArrowLeft, ChevronRight, Loader2, IndianRupee } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { deliveryAPI } from "@food/api"

export default function CustomerTips() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [totalTips, setTotalTips] = useState(0)
  const [tipCount, setTipCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    deliveryAPI
      .getTips({ limit: 1 })
      .then((res) => {
        if (cancelled) return
        setTotalTips(Number(res?.data?.data?.totalTips) || 0)
        setTipCount(Number(res?.data?.data?.tipCount) || 0)
      })
      .catch(() => toast.error("Failed to load tips"))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 bg-white px-4 py-4 border-b">
        <button onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Customer tips</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-2xl bg-white p-5 border">
          <p className="text-sm text-gray-500">Tips balance</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-2" />
          ) : (
            <p className="text-3xl font-bold flex items-center">
              <IndianRupee className="h-6 w-6" />
              {totalTips.toFixed(2)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            From {tipCount} {tipCount === 1 ? "order" : "orders"}. Tips are included in your pocket balance.
          </p>
        </div>

        <button
          onClick={() => navigate("/food/delivery/tips-statement")}
          className="w-full flex items-center justify-between rounded-2xl bg-white border px-4 py-4 text-sm font-medium"
        >
          View tips statement
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}
