package com.reactnativeftvatvdemoapp

import android.util.Log
import android.content.Intent
import com.google.android.gms.cast.tv.CastReceiverContext

class ExtendedMainActivity : MainActivity() {
    
  override fun onStart() {
      super.onStart()
      
      handleLoadIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
      super.onNewIntent(intent)

      handleLoadIntent(intent)
  }

  private fun handleLoadIntent(intent: Intent) {
       Log.d("PlatformSplashActivity", intent.toString() + "\n" + CastReceiverContext.getInstance()?.mediaManager.toString())
       CastReceiverContext.getInstance()?.mediaManager?.let { mediaManager ->
            // Pass the intent to the SDK.
            if (mediaManager.onNewIntent(intent)) {
                Log.d("PlatformSplashActivity", "The intent is already handled by the SDK")
            }
        }
  }
}
