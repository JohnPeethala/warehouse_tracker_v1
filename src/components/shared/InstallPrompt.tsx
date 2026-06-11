'use client'

import { useState, useEffect } from 'react'
import { X, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS] = useState(false)

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as any).standalone === true)
    if (isStandalone) return

    // Don't show if dismissed recently (24 hr cooldown)
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    // iOS detection
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)
    if (isIOS && isSafari) {
      setShowIOS(true)
      return
    }

    // Android / Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setShowAndroid(false)
    setShowIOS(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowAndroid(false)
      setDeferredPrompt(null)
    }
  }

  if (!showAndroid && !showIOS) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.18)] p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo.svg" alt="App icon" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">Add to Home Screen</p>
              <p className="text-xs text-foreground/50 mt-0.5">Warehouse Ops</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="p-1 rounded-full hover:bg-muted text-foreground/40 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Android: single install button */}
        {showAndroid && (
          <button
            onClick={handleInstall}
            className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            Install App
          </button>
        )}

        {/* iOS: step-by-step guide */}
        {showIOS && (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 bg-muted/40 rounded-xl px-3 py-2">
              <Share size={15} className="text-primary shrink-0" />
              <p className="text-xs text-foreground/70">
                Tap the <span className="font-bold text-foreground">Share</span> button in Safari
              </p>
            </div>
            <div className="flex items-center gap-2.5 bg-muted/40 rounded-xl px-3 py-2">
              <Plus size={15} className="text-primary shrink-0" />
              <p className="text-xs text-foreground/70">
                Select <span className="font-bold text-foreground">Add to Home Screen</span>
              </p>
            </div>
            <button
              onClick={dismiss}
              className="w-full py-2 rounded-xl text-xs font-semibold text-foreground/50 hover:bg-muted transition-colors mt-1"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
