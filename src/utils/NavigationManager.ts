// NavigationManager.ts
import {NavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from '../types/Types';

/**
 * NavigationManager handles navigation logic for the application
 * It provides methods to navigate between screens with special handling for VideoPlayer
 */
class NavigationManager {
  private navigationRef: NavigationContainerRef<RootStackParamList> | null =
    null;
  private static instance: NavigationManager | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of NavigationManager
   */
  public static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  /**
   * Set the navigation reference
   * @param navRef - The navigation container reference
   */
  public setNavigationRef(
    navRef: NavigationContainerRef<RootStackParamList>,
  ): void {
    this.navigationRef = navRef;
  }

  /**
   * Get the current route name
   * @returns The current route name or null if not available
   */
  public getCurrentRouteName(): string | null {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      return null;
    }

    return this.navigationRef.getCurrentRoute()?.name || null;
  }

  /**
   * Navigate to a screen, with special handling for VideoPlayer
   * If currently in VideoPlayer, it replaces the screen instead of pushing a new one
   * @param screenName - Name of the screen to navigate to
   * @param params - Parameters to pass to the screen
   */
  public navigate<T extends keyof RootStackParamList>(
    screenName: T,
    params?: RootStackParamList[T],
  ): void {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      console.warn('Navigation attempted before navigator is ready');
      return;
    }

    const currentRoute = this.getCurrentRouteName();

    // Special handling for VideoPlayer
    if (screenName === 'VideoPlayer' || screenName === 'SignIn') {
      if (currentRoute === 'VideoPlayer' || currentRoute === 'SignIn') {
        // If already on VideoPlayer, replace instead of navigate
        this.goBack();
        this.navigationRef.dispatch({
          type: 'NAVIGATE',
          payload: {
            name: screenName,
            params,
          },
        });
      } else {
        // Normal navigation
        this.navigationRef.dispatch({
          type: 'NAVIGATE',
          payload: {
            name: screenName,
            params,
          },
        });
      }
    } else {
      // For all other screens, use normal navigation
      this.navigationRef.dispatch({
        type: 'NAVIGATE',
        payload: {
          name: screenName,
          params,
        },
      });
    }
  }

  /**
   * Navigate back to the previous screen
   */
  public goBack(): void {
    if (
      this.navigationRef &&
      this.navigationRef.isReady() &&
      this.navigationRef.canGoBack()
    ) {
      this.navigationRef.goBack();
    }
  }

  /**
   * Reset the navigation state to a specific route
   * @param routeName - The route name to reset to
   * @param params - Parameters to pass to the route
   */
  public resetTo<T extends keyof RootStackParamList>(
    routeName: T,
    params?: RootStackParamList[T],
  ): void {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      return;
    }

    this.navigationRef.reset({
      index: 0,
      routes: [{name: routeName, params}],
    });
  }
}

export default NavigationManager;
