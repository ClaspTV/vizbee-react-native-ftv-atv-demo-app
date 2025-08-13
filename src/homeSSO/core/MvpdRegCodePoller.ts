import {RegCodePoller} from './RegCodePoller';
import {AuthRepository} from '../auth/AuthRepository';
import {RegCode} from '../types';

export class MvpdRegCodePoller extends RegCodePoller {
  constructor(authRepository: AuthRepository, pollingInterval: number = 2000) {
    super(authRepository, pollingInterval);
  }

  protected async doRequestCode(): Promise<RegCode> {
    return this.authRepository.fetchAccountRegCode();
  }

  protected async startRegCodeProcess(regCode: string): Promise<void> {
    await this.pollRegCode(regCode);
  }

  protected async pollRegCode(regCode: string): Promise<void> {
    const checkPolling = () => this._isPolling;

    await this.authRepository.pollForRegCodeStatus(
      regCode,
      result => this.onRegCodePollResult(result),
      this.pollingInterval,
      checkPolling,
    );
  }
}
