/**
 * MvpdRegCodePoller
 *
 * Concrete implementation of RegCodePoller for MVPD authentication
 */

import {RegCodePoller} from '../base/RegCodePoller';
import {AuthRepository} from '../../auth/AuthRepository';
import {RegCode} from '../../Types';

export class MvpdRegCodePoller extends RegCodePoller {
  constructor(authRepository: AuthRepository, pollingInterval: number = 2000) {
    super(authRepository, pollingInterval);
    // Initialize MVPD-specific registration code poller
  }

  protected async doRequestCode(): Promise<RegCode> {
    // Request MVPD registration code from auth repository
    return this.authRepository.fetchAccountRegCode();
  }

  protected async startRegCodeProcess(regCode: string): Promise<void> {
    // Start the MVPD registration code polling process
    await this.pollRegCode(regCode);
  }

  protected async pollRegCode(regCode: string): Promise<void> {
    const checkPolling = () => this._isPolling;

    // Start MVPD registration code polling with configured interval
    await this.authRepository.pollForRegCodeStatus(
      regCode,
      result => this.onRegCodePollResult(result),
      this.pollingInterval,
      checkPolling,
    );
  }
}
