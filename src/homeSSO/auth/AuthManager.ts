import AsyncStorage from "@react-native-async-storage/async-storage";

export class AuthManager {
  constructor() {}

  async isSignedIn(signInType: string): Promise<boolean> {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      return authToken !== null && authToken !== "";
    } catch (error) {
      console.error("Error checking sign in status:", error);
      return false;
    }
  }
}
