import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
import { AppShellSkeleton } from '@food/components/ui/loading-skeletons'
import LandingPage from './LandingPage'
import { isFeatureEnabled, loadCorePublicAppConfig } from '@food/services/publicAppConfig'
import { WifiOff, RotateCw } from 'lucide-react'
import { toast } from 'sonner'

const NATIVE_LAST_ROUTE_KEY = 'native_last_route'

// Lazy load the Food service module (Quick-spicy app)
const FoodApp = lazy(() => import('../modules/Food/routes'))
const AuthApp = lazy(() => import('../modules/auth/routes'))
import ProtectedRoute from '@food/components/ProtectedRoute'

const PageLoader = () => {
  const location = useLocation()
  const path = location.pathname

  if (path === '/food/user' || path === '/food/user/' || path === '/') {
    return <AppShellSkeleton />
  }

  const isDark = path.includes('/delivery') || path.includes('/admin')
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-zinc-950 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        <p className="text-orange-500 font-bold uppercase tracking-widest text-xs">Loading...</p>
      </div>
    </div>
  )
}

/**
 * FoodAppWrapper — Quick-spicy App. को /food prefix के साथ render करता है.
 * 
 * Quick-spicy की App.jsx में routes /restaurant, /usermain, /admin, /delivery
 * जैसे hain (bina /food prefix ke). Yahan hum useLocation se /food ke baad wala
 * path nikalne ke baad FoodApp render karte hain. FoodApp internally BrowserRouter
 * nahi use karta (sirf Routes use karta hai), isliye ye directly kaam karta hai.
 */
const FoodAppWrapper = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <FoodApp />
    </Suspense>
  )
}

const RedirectToFood = () => {
  const location = useLocation();
  // We safely replace the exact current pathname with a /food prefixed pathname
  // This effectively catches programmatic navigation to absolute paths like '/restaurant/login'
  // and turns them into '/food/restaurant/login'
  return <Navigate to={`/food${location.pathname}${location.search}`} state={location.state} replace />;
};

const RootEntryRoute = () => {
  const [loading, setLoading] = useState(true)
  const [showLandingAtRoot, setShowLandingAtRoot] = useState(true)

  useEffect(() => {
    const loadFeatureSettings = async () => {
      try {
        await loadCorePublicAppConfig()
        setShowLandingAtRoot(
          isFeatureEnabled("root_landing_and_unregistered_control", true),
        )
      } catch (_error) {
        // fallback to landing page when API is unavailable
      } finally {
        setLoading(false)
      }
    }
    loadFeatureSettings()
  }, [])

  if (loading) return <PageLoader />
  if (!showLandingAtRoot) return <Navigate to="/food/user" replace />
  return <LandingPage />
}


const AdminRouter = lazy(() => import('../modules/Food/components/admin/AdminRouter'))

function OfflinePage() {
  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload()
    } else {
      toast.error("Still offline. Please check your internet connection.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center text-rose-500 animate-pulse">
          <WifiOff className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
            No Internet Connection
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Please check your network cables, Wi-Fi, or cellular data and try again.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full bg-[#EB590E] hover:bg-[#D94F0C] text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
          >
            <RotateCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}

const AppRoutes = () => {
  const location = useLocation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const protocol = String(window.location?.protocol || '').toLowerCase()
    const userAgent = String(window.navigator?.userAgent || '').toLowerCase()
    const isNativeLikeShell =
      Boolean(window.flutter_inappwebview) ||
      Boolean(window.ReactNativeWebView) ||
      protocol === 'file:' ||
      userAgent.includes(' wv') ||
      userAgent.includes('; wv')

    if (!isNativeLikeShell) return

    const route = `${location.pathname || ''}${location.search || ''}`
    if (route.startsWith('/food/') || route.startsWith('/admin')) {
      localStorage.setItem(NATIVE_LAST_ROUTE_KEY, route)
    }
  }, [location.pathname, location.search])

  if (!isOnline) {
    return <OfflinePage />
  }

  return (
    <Routes>
      {/* Root → Master Landing Page */}
      <Route path="/" element={<RootEntryRoute />} />

      {/* Auth Module */}


      {/* Food Module */}
      <Route path="/food/*" element={<FoodAppWrapper />} />

      {/* Global Admin Portal - AdminRouter handles its own protection for sub-routes */}
      <Route path="/admin/*" element={<AdminRouter />} />

      {/* NEW Delivery V2 (Parallel testing) */}
      {/* Global Admin Portal - wrap lazy router in Suspense to avoid blank/crash on direct admin URLs */}
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<PageLoader />}>
            <AdminRouter />
          </Suspense>
        }
      />
      
      {/* Dynamic intercept redirects for bare paths (accessed programmatically) */}
      <Route path="/user/*" element={<RedirectToFood />} />
      <Route path="/restaurant/*" element={<RedirectToFood />} />
      <Route path="/delivery/*" element={<RedirectToFood />} />
      <Route path="/usermain/*" element={<RedirectToFood />} />
      <Route path="/profile/*" element={<RedirectToFood />} />
      <Route path="/cart/*" element={<Navigate to="/food/user/cart" replace />} />
      <Route path="/orders/*" element={<RedirectToFood />} />

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
