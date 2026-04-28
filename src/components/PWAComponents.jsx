import React, { useEffect, useState } from 'react';
import { Download, X, AlertCircle } from 'lucide-react';
import { Button } from 'antd';

/**
 * PWA Install Prompt Component
 * Shows a banner when PWA can be installed
 */
export function PWAInstallPrompt({ 
  onDismiss, 
  showPrompt, 
  onInstall,
  isInstalled = false 
}) {
  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Download className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Install Oraka</h3>
            <p className="text-sm text-gray-600">Download our app for offline access</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onInstall}
          type="primary"
          size="small"
          className="flex-1"
        >
          Install
        </Button>
        <Button 
          onClick={onDismiss}
          size="small"
          className="flex-1"
        >
          Later
        </Button>
      </div>
    </div>
  );
}

/**
 * Update Available Notification Component
 */
export function UpdateAvailableNotification({ 
  isVisible, 
  onUpdate, 
  onDismiss,
  updateType = 'pwa' // 'pwa' or 'electron'
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-50 rounded-lg shadow-lg p-4 max-w-sm z-50 border border-yellow-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Update Available</h3>
            <p className="text-sm text-gray-600">
              {updateType === 'electron' 
                ? 'A new version of Oraka is ready to install' 
                : 'A new version is available. Refresh to update'}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onUpdate}
          type="primary"
          size="small"
          className="flex-1"
          danger
        >
          Update Now
        </Button>
        <Button 
          onClick={onDismiss}
          size="small"
          className="flex-1"
        >
          Later
        </Button>
      </div>
    </div>
  );
}

/**
 * Offline Status Indicator Component
 */
export function OfflineIndicator({ isOnline }) {
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white rounded-lg px-4 py-2 shadow-lg z-50 flex items-center gap-2">
      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      <span className="text-sm font-medium">You are offline - Changes will sync when online</span>
    </div>
  );
}

/**
 * App Version Display Component (useful for debugging/support)
 */
export function AppVersionDisplay({ version, showInFooter = true }) {
  if (!version) {
    return null;
  }

  if (showInFooter) {
    return (
      <div className="text-xs text-gray-500 text-center mt-4 pt-2 border-t border-gray-200">
        Oraka v{version}
      </div>
    );
  }

  return (
    <span className="text-xs text-gray-500">v{version}</span>
  );
}
