import React, { useEffect, useState } from "react"
import { ArrowLeft, Loader2, IndianRupee } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { deliveryAPI } from "@food/api"

const formatDate = (value) => {
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default function TipsStatement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ totalTips: 0, tipCount: 0, tips: [] })

  useEffect(() => {
    let cancelled = false
    deliveryAPI
      .getTips({ limit: 200 })
      .then((res) => {
        if (!cancelled) setData(res?.data?.data || { totalTips: 0, tipCount: 0, tips: [] })
      })
      .catch(() => toast.error("Failed to load tips"))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="flex items-center gap-3 bg-white px-4 py-4 border-b">
        <button onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Tips statement</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-2xl bg-white p-5 border">
          <p className="text-sm text-gray-500">Total tips received</p>
          <p className="text-3xl font-bold flex items-center">
            <IndianRupee className="h-6 w-6" />
            {Number(data.totalTips).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.tipCount} {data.tipCount === 1 ? "order" : "orders"} · you keep 100% of every tip
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : data.tips.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-10">No tips yet.</p>
        ) : (
          <ul className="rounded-2xl bg-white border divide-y">
            {data.tips.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Order #{String(t.orderId).slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                </div>
                <span className="text-sm font-bold text-green-600">+₹{Number(t.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
