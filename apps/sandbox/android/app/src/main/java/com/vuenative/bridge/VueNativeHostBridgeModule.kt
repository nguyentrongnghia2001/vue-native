package com.vuenative.bridge

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray

class VueNativeHostBridgeModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    const val MODULE_NAME = "VueNativeHostBridge"
    const val EVENT_NAME = "vue-native:bridge-event"
  }

  private var sentBatches = 0
  private var sentMutations = 0
  private var receivedEvents = 0
  private var lastBatchSize = 0

  override fun getName(): String = MODULE_NAME

  @ReactMethod
  fun applyMutations(batch: ReadableArray, promise: Promise) {
    val size = batch.size()
    recordBatch(size)
    promise.resolve(createAck(ok = true, processed = size))
  }

  @ReactMethod
  fun applyMutationBatch(payload: String, promise: Promise) {
    val size = countMutationsFromJson(payload)
    recordBatch(size)
    promise.resolve(createAck(ok = true, processed = size))
  }

  @ReactMethod
  fun sendMutations(payload: Dynamic, promise: Promise) {
    when (payload.type) {
      ReadableType.Array -> {
        val array = payload.asArray()
        val size = array?.size() ?: 0
        recordBatch(size)
        promise.resolve(createAck(ok = true, processed = size))
      }

      ReadableType.String -> {
        val size = countMutationsFromJson(payload.asString())
        recordBatch(size)
        promise.resolve(createAck(ok = true, processed = size))
      }

      else -> {
        promise.resolve(
          createAck(
            ok = false,
            processed = 0,
            error = "sendMutations supports only array|string payload",
          ),
        )
      }
    }
  }

  @ReactMethod
  fun emitEvent(nodeId: Double, event: String, payload: ReadableMap?) {
    receivedEvents += 1

    val eventBody = Arguments.createMap().apply {
      putInt("nodeId", nodeId.toInt())
      putString("event", event)
      payload?.let {
        val args = Arguments.createArray().apply {
          pushMap(it)
        }
        putArray("args", args)
      }
    }

    emitToJs(eventBody)
  }

  @ReactMethod
  fun getStats(promise: Promise) {
    val result = Arguments.createMap().apply {
      putString("mode", "native-module")
      putInt("sentBatches", sentBatches)
      putInt("sentMutations", sentMutations)
      putInt("receivedEvents", receivedEvents)
      putInt("lastBatchSize", lastBatchSize)
    }

    promise.resolve(result)
  }

  private fun countMutationsFromJson(payload: String): Int {
    return try {
      val trimmed = payload.trim()
      if (trimmed.isEmpty()) return 0

      if (trimmed.startsWith("[")) {
        JSONArray(trimmed).length()
      } else {
        1
      }
    } catch (_: Throwable) {
      0
    }
  }

  private fun recordBatch(size: Int) {
    sentBatches += 1
    sentMutations += size
    lastBatchSize = size
  }

  private fun createAck(ok: Boolean, processed: Int, error: String? = null): WritableMap {
    return Arguments.createMap().apply {
      putBoolean("ok", ok)
      putInt("processed", processed)
      if (!error.isNullOrEmpty()) {
        putString("error", error)
      }
    }
  }

  private fun emitToJs(event: WritableMap) {
    if (!reactApplicationContext.hasActiveReactInstance()) return

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(EVENT_NAME, event)
  }
}
