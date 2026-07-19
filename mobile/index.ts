import 'react-native-url-polyfill/auto';
import "react-native-gesture-handler";
import "react-native-get-random-values";
import "react-native-reanimated";
import { LogBox } from "react-native";
import "./global.css";
import "expo-router/entry";

LogBox.ignoreLogs(["Expo AV has been deprecated", "Disconnected from Metro"]);

type ReactNativeErrorUtils = {
  getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
  setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
};

const errorUtils = (globalThis as typeof globalThis & { ErrorUtils?: ReactNativeErrorUtils }).ErrorUtils;

if (errorUtils) {
  const _globalHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    if (error?.message?.includes('Network request failed')) {
      console.warn('Network error (suppressed crash):', error.message);
      return;
    }
    _globalHandler(error, isFatal);
  });
}
