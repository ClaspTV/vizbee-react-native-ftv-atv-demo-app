import { DeeplinkManager } from "./DeeplinkManager";

export class AppReadyModel {
  public readonly deeplinkManager: DeeplinkManager;

  constructor() {
    this.deeplinkManager = new DeeplinkManager();
  }
}
