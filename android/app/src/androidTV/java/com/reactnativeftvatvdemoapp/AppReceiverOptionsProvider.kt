package com.reactnativeftvatvdemoapp

import android.content.Context
import com.google.android.gms.cast.tv.CastReceiverOptions
import com.google.android.gms.cast.tv.ReceiverOptionsProvider
import java.util.*
 
class AppReceiverOptionsProvider : ReceiverOptionsProvider {
 
    override fun getOptions(context: Context): CastReceiverOptions {
        return CastReceiverOptions.Builder(context)
            .setCustomNamespaces(
                Arrays.asList("urn:x-cast:tv.vizbee.sync")
            )
            .build()
    }
}