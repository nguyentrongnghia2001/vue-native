import Foundation
import React

@objc(VueNativeHostBridge)
final class VueNativeHostBridge: RCTEventEmitter {
  private static let eventName = "vue-native:bridge-event"

  private var hasListeners = false
  private var sentBatches = 0
  private var sentMutations = 0
  private var receivedEvents = 0
  private var lastBatchSize = 0

  override static func requiresMainQueueSetup() -> Bool {
    false
  }

  override func supportedEvents() -> [String]! {
    [Self.eventName]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(applyMutations:resolver:rejecter:)
  func applyMutations(
    _ batch: [Any],
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    recordBatch(batch.count)
    resolve(createAck(ok: true, processed: batch.count, error: nil))
  }

  @objc(applyMutationBatch:resolver:rejecter:)
  func applyMutationBatch(
    _ payload: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let count = countMutationsFromJson(payload)
    recordBatch(count)
    resolve(createAck(ok: true, processed: count, error: nil))
  }

  @objc(sendMutations:resolver:rejecter:)
  func sendMutations(
    _ payload: Any,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    if let arrayPayload = payload as? [Any] {
      recordBatch(arrayPayload.count)
      resolve(createAck(ok: true, processed: arrayPayload.count, error: nil))
      return
    }

    if let stringPayload = payload as? String {
      let count = countMutationsFromJson(stringPayload)
      recordBatch(count)
      resolve(createAck(ok: true, processed: count, error: nil))
      return
    }

    resolve(createAck(ok: false, processed: 0, error: "sendMutations supports only array|string payload"))
  }

  @objc(emitEvent:event:payload:)
  func emitEvent(_ nodeId: NSNumber, event: String, payload: Any?) {
    receivedEvents += 1

    guard hasListeners else {
      return
    }

    var body: [String: Any] = [
      "nodeId": nodeId.intValue,
      "event": event,
    ]

    if let payload = payload {
      body["args"] = [payload]
    }

    sendEvent(withName: Self.eventName, body: body)
  }

  @objc(getStats:rejecter:)
  func getStats(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    resolve([
      "mode": "native-module",
      "sentBatches": sentBatches,
      "sentMutations": sentMutations,
      "receivedEvents": receivedEvents,
      "lastBatchSize": lastBatchSize,
    ])
  }

  private func countMutationsFromJson(_ payload: String) -> Int {
    let data = Data(payload.utf8)
    guard let json = try? JSONSerialization.jsonObject(with: data) else {
      return 0
    }

    if let array = json as? [Any] {
      return array.count
    }

    return 1
  }

  private func recordBatch(_ size: Int) {
    sentBatches += 1
    sentMutations += size
    lastBatchSize = size
  }

  private func createAck(ok: Bool, processed: Int, error: String?) -> [String: Any] {
    var ack: [String: Any] = [
      "ok": ok,
      "processed": processed,
    ]

    if let error {
      ack["error"] = error
    }

    return ack
  }
}
