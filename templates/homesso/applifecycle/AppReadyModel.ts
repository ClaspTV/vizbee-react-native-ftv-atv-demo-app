/**
 * AppReadyModel
 *
 * Model representing the ready state of the application
 */

import {MyVizbeeDeeplinkManager} from '../deeplink/MyVizbeeDeeplinkManager';

export class AppReadyModel {
  public readonly deeplinkManager: MyVizbeeDeeplinkManager;

  constructor() {
    // Initialize app ready model with deeplink manager
    this.deeplinkManager = new MyVizbeeDeeplinkManager();
  }
}
