// VideoEvents.ts
import { EventEmitter } from "events";

export type VideoEventCallback = () => void;

interface VideoEventsInterface {
  emitVideoStopped(): void;
  emitVideoStarted(): void;
  emitInterruptedStatusSent(): void;
  onVideoStopped(callback: VideoEventCallback): () => void;
  onVideoStarted(callback: VideoEventCallback): () => void;
  onInterruptedStatusSent(callback: VideoEventCallback): () => void;
}

class VideoEvents extends EventEmitter implements VideoEventsInterface {
  private static instance: VideoEvents | null = null;

  private constructor() {
    super();
  }

  static getInstance(): VideoEvents {
    if (!VideoEvents.instance) {
      VideoEvents.instance = new VideoEvents();
    }
    return VideoEvents.instance;
  }

  emitVideoStopped(): void {
    this.emit("videoStopped");
  }

  emitVideoStarted(): void {
    this.emit("videoStarted");
  }

  emitInterruptedStatusSent(): void {
    this.emit("interruptedStatusSent");
  }

  onVideoStopped(callback: VideoEventCallback): () => void {
    this.on("videoStopped", callback);
    // Return unsubscribe function
    return () => this.off("videoStopped", callback);
  }

  onVideoStarted(callback: VideoEventCallback): () => void {
    this.on("videoStarted", callback);
    // Return unsubscribe function
    return () => this.off("videoStarted", callback);
  }

  onInterruptedStatusSent(callback: VideoEventCallback): () => void {
    this.on("interruptedStatusSent", callback);
    // Return unsubscribe function
    return () => this.off("interruptedStatusSent", callback);
  }
}

export default VideoEvents.getInstance();
