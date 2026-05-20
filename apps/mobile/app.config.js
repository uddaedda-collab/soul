const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

const googleServicesFile = './google-services.json';
const hasGoogleServicesFile = fs.existsSync(path.join(__dirname, googleServicesFile));
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? appJson.expo.extra?.eas?.projectId;

const firebasePlugins = hasGoogleServicesFile
  ? ['@react-native-firebase/app', '@react-native-firebase/auth', '@react-native-firebase/messaging']
  : [];

module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    ...(hasGoogleServicesFile ? { googleServicesFile } : {})
  },
  plugins: [...(appJson.expo.plugins ?? []), ...firebasePlugins],
  extra: {
    ...(appJson.expo.extra ?? {}),
    eas: {
      ...(appJson.expo.extra?.eas ?? {}),
      projectId: easProjectId
    },
    firebaseNativeReady: hasGoogleServicesFile
  }
};
