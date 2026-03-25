import { AuthRepository } from "../auth/AuthRepository";
import { RegCode, RegCodePollResult, RegCodePollStatus } from "../types";

export abstract class RegCodePoller {
  private pollTimer?: NodeJS.Timeout;
  private _regCode: string = "";
  private _isCheckDone: boolean = false;
  protected _isPolling: boolean = false;
  private listeners: {
    onRegCodeChange?: (code: string) => void;
    onCheckDoneChange?: (isDone: boolean) => void;
  } = {};

  constructor(
    protected readonly authRepository: AuthRepository,
    protected readonly pollingInterval: number = 2000
  ) {}

  async requestCode(): Promise<string> {
    this.setIsCheckDone(false);
    try {
      const result = await this.doRequestCode();
      this.setRegCode(result.code);
      return result.code;
    } catch (error) {
      console.error("Error requesting code:", error);
      throw error;
    }
  }

  protected abstract doRequestCode(): Promise<RegCode>;
  protected abstract startRegCodeProcess(regCode: string): Promise<void>;
  protected abstract pollRegCode(regCode: string): Promise<void>;

  startPoll(regCode: string) {
    this.stopPoll();
    this._isPolling = true;
    this.startRegCodeProcess(regCode)
      .then(() => {
        if (this._isPolling) {
          this.setIsCheckDone(true);
        }
      })
      .catch((error) => {
        console.error("Error in poll process:", error);
        this.stopPoll();
      });
  }

  stopPoll() {
    console.log("Stopping poll");
    this._isPolling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.setIsCheckDone(false);
  }

  protected onRegCodePollResult(result: RegCodePollResult): boolean {
    return result.status === RegCodePollStatus.DONE;
  }

  private setRegCode(code: string) {
    this._regCode = code;
    this.listeners.onRegCodeChange?.(code);
  }

  private setIsCheckDone(isDone: boolean) {
    this._isCheckDone = isDone;
    this.listeners.onCheckDoneChange?.(isDone);
  }

  get regCode(): string {
    return this._regCode;
  }

  get isCheckDone(): boolean {
    return this._isCheckDone;
  }

  setOnRegCodeChangeListener(listener: (code: string) => void) {
    this.listeners.onRegCodeChange = listener;
  }

  setOnCheckDoneChangeListener(listener: (isDone: boolean) => void) {
    this.listeners.onCheckDoneChange = listener;
  }

  removeListeners() {
    this.listeners = {};
  }
}
