'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_STORAGE_KEY = 'pwa-install-dismissed';
const DISMISS_COOLDOWN_DAYS = 7;

function isIOSDevice(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function wasDismissedRecently(): boolean {
  const wasDismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!wasDismissed) return false;

  const dismissedDate = new Date(wasDismissed);
  const daysSinceDismissed =
    (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceDismissed < DISMISS_COOLDOWN_DAYS;
}

function IOSInstallBanner({
  onShowInstructions,
  onDismiss,
}: {
  onShowInstructions: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Download className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Install Scaffold</p>
              <p className="text-xs text-muted-foreground">
                Add to home screen
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onDismiss}
          >
            <X className="size-4" />
          </Button>
        </div>
        <Button className="mt-3 w-full" size="sm" onClick={onShowInstructions}>
          Show Instructions
        </Button>
      </div>
    </div>
  );
}

function IOSInstructionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install Scaffold</DialogTitle>
          <DialogDescription>
            Follow these steps to add Scaffold to your home screen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="font-bold text-primary">1</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Tap the</span>
              <Share className="size-5" />
              <span>share button</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="font-bold text-primary">2</span>
            </div>
            <span>Scroll down in the share menu</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="font-bold text-primary">3</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Tap</span>
              <Plus className="size-5" />
              <span>&quot;Add to Home Screen&quot;</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AndroidInstallBanner({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Download className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Install Scaffold</p>
              <p className="text-xs text-muted-foreground">
                Get the full app experience
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onDismiss}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onDismiss}
          >
            Not now
          </Button>
          <Button size="sm" className="flex-1" onClick={onInstall}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());
    setIsIOS(isIOSDevice());
    setDismissed(wasDismissedRecently());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log('[PWA] App installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString());
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log('[PWA] User choice:', outcome);

    if (outcome === 'dismissed') {
      handleDismiss();
    }

    setDeferredPrompt(null);
  }, [deferredPrompt, handleDismiss]);

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  // iOS prompt - show modal with instructions
  if (isIOS && !deferredPrompt) {
    return (
      <>
        <IOSInstallBanner
          onShowInstructions={() => setShowIOSPrompt(true)}
          onDismiss={handleDismiss}
        />
        <IOSInstructionsDialog
          open={showIOSPrompt}
          onOpenChange={setShowIOSPrompt}
        />
      </>
    );
  }

  // Android/Chrome prompt - show install banner
  if (deferredPrompt) {
    return (
      <AndroidInstallBanner
        onInstall={() => void handleInstallClick()}
        onDismiss={handleDismiss}
      />
    );
  }

  return null;
}
