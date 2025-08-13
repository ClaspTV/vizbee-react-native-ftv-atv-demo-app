/**
 * VideoEvents Template
 *
 * Event system for video playback state management
 * CLIENT TODO: Replace with your video player event system
 */

export type VideoEventCallback = () => void;

interface VideoEventsInterface {
  emitVideoStopped(): void;
  emitVideoStarted(): void;
  emitInterruptedStatusSent(): void;
  onVideoStopped(callback: VideoEventCallback): () => void;
  onVideoStarted(callback: VideoEventCallback): () => void;
  onInterruptedStatusSent(callback: VideoEventCallback): () => void;
}

class VideoEvents implements VideoEventsInterface {
  private static instance: VideoEvents | null = null;
  private listeners: {[key: string]: VideoEventCallback[]} = {};

  private constructor() {}

  static getInstance(): VideoEvents {
    if (!VideoEvents.instance) {
      VideoEvents.instance = new VideoEvents();
    }
    return VideoEvents.instance;
  }

  emitVideoStopped(): void {
    // Emit video stopped event to all listeners
    this.emit('videoStopped');
  }

  emitVideoStarted(): void {
    // Emit video started event to all listeners
    this.emit('videoStarted');
  }

  emitInterruptedStatusSent(): void {
    // Emit interrupted status sent event to all listeners
    this.emit('interruptedStatusSent');
  }

  onVideoStopped(callback: VideoEventCallback): () => void {
    return this.addEventListener('videoStopped', callback);
  }

  onVideoStarted(callback: VideoEventCallback): () => void {
    return this.addEventListener('videoStarted', callback);
  }

  onInterruptedStatusSent(callback: VideoEventCallback): () => void {
    return this.addEventListener('interruptedStatusSent', callback);
  }

  private emit(eventName: string): void {
    const callbacks = this.listeners[eventName] || [];
    callbacks.forEach(callback => callback());
  }

  private addEventListener(
    eventName: string,
    callback: VideoEventCallback,
  ): () => void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);

    // Return unsubscribe function
    return () => this.removeEventListener(eventName, callback);
  }

  private removeEventListener(
    eventName: string,
    callback: VideoEventCallback,
  ): void {
    if (!this.listeners[eventName]) return;
    const index = this.listeners[eventName].indexOf(callback);
    if (index !== -1) {
      this.listeners[eventName].splice(index, 1);
    }
  }
}

export default VideoEvents.getInstance();
