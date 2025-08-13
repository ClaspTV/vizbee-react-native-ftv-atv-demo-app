/**
 * AppReadyModel
 *
 * Model representing the ready state of the application
 */

import {DeeplinkManager} from './DeeplinkManager';

export class AppReadyModel {
  public readonly deeplinkManager: DeeplinkManager;

  constructor() {
    // Initialize app ready model with deeplink manager
    this.deeplinkManager = new DeeplinkManager();
  }
}
