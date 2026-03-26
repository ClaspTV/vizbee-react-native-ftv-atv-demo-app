/**
 * RegCodePoller Abstract Class
 *
 * Base class for implementing registration code polling functionality
 */

import {MyVizbeeAuthRepository as AuthRepository} from '../../auth/MyVizbeeAuthRepository';
import {
  RegCode,
  RegCodePollResult,
  RegCodePollStatus,
} from '../../MyVizbeeTypes';

export abstract class MyVizbeeRegCodePoller {
  private pollTimer?: NodeJS.Timeout;
  private _regCode: string = '';
  private _isCheckDone: boolean = false;
  protected _isPolling: boolean = false;
  private listeners: {
    onRegCodeChange?: (code: string) => void;
    onCheckDoneChange?: (isDone: boolean) => void;
  } = {};

  constructor(
    protected readonly authRepository: AuthRepository,
    protected readonly pollingInterval: number = 2000,
  ) {}

  /**
   * Requests a new registration code from the server
   */
  async requestCode(): Promise<string> {
    // Reset check done status and request new code from server
    this.setIsCheckDone(false);
    try {
      const result = await this.doRequestCode();
      this.setRegCode(result.code);
      return result.code;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Starts polling for registration code status
   */
  startPoll(regCode: string) {
    // Stop any existing polling and start new polling process
    this.stopPoll();
    this._isPolling = true;

    this.startRegCodeProcess(regCode)
      .then(() => {
        if (this._isPolling) {
          // Polling completed successfully
          this.setIsCheckDone(true);
        }
      })
      .catch(error => {
        // Handle polling error by stopping the process
        this.stopPoll();
      });
  }

  /**
   * Stops the polling process
   */
  stopPoll() {
    // Stop polling and clear any active timers
    this._isPolling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.setIsCheckDone(false);
  }

  /**
   * Handles poll result and determines if polling should continue
   */
  protected onRegCodePollResult(result: RegCodePollResult): boolean {
    // Return true if polling is complete (success), false to continue polling
    return result.status === RegCodePollStatus.DONE;
  }

  private setRegCode(code: string) {
    // Update registration code and notify listeners
    this._regCode = code;
    this.listeners.onRegCodeChange?.(code);
  }

  private setIsCheckDone(isDone: boolean) {
    // Update check done status and notify listeners
    this._isCheckDone = isDone;
    this.listeners.onCheckDoneChange?.(isDone);
  }

  // Getters
  get regCode(): string {
    return this._regCode;
  }

  get isCheckDone(): boolean {
    return this._isCheckDone;
  }

  // Listener management
  setOnRegCodeChangeListener(listener: (code: string) => void) {
    this.listeners.onRegCodeChange = listener;
  }

  setOnCheckDoneChangeListener(listener: (isDone: boolean) => void) {
    this.listeners.onCheckDoneChange = listener;
  }

  removeListeners() {
    // Remove all registered listeners
    this.listeners = {};
  }

  // Abstract methods that subclasses must implement
  protected abstract doRequestCode(): Promise<RegCode>;
  protected abstract startRegCodeProcess(regCode: string): Promise<void>;
  protected abstract pollRegCode(regCode: string): Promise<void>;
}
