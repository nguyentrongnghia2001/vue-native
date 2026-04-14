#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(thisFilePath), '..', '..');

export const PRODUCT_MANIFEST_PATH = path.join(repoRoot, 'apps', 'product-host', 'app.json');
export const PRODUCT_PACKAGE_PATH = path.join(repoRoot, 'apps', 'product-host', 'package.json');

export const REQUIRED_ANDROID_PERMISSIONS = ['android.permission.INTERNET'];

export const REQUIRED_BLOCKED_ANDROID_PERMISSIONS = [
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.CAMERA',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.READ_CONTACTS',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.RECORD_AUDIO',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.VIBRATE',
  'android.permission.WRITE_CONTACTS',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

export const FORBIDDEN_IOS_USAGE_DESCRIPTION_KEYS = [
  'NSBluetoothAlwaysUsageDescription',
  'NSCalendarsUsageDescription',
  'NSCameraUsageDescription',
  'NSContactsUsageDescription',
  'NSFaceIDUsageDescription',
  'NSLocationAlwaysAndWhenInUseUsageDescription',
  'NSLocationWhenInUseUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSMotionUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSRemindersUsageDescription',
  'NSSpeechRecognitionUsageDescription',
  'NSUserTrackingUsageDescription',
];

export const FORBIDDEN_DIRECT_DEPENDENCIES = [
  'expo-av',
  'expo-barcode-scanner',
  'expo-camera',
  'expo-contacts',
  'expo-image-picker',
  'expo-location',
  'expo-media-library',
  'expo-notifications',
];

export function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function loadProductManifestConfig(filePath = PRODUCT_MANIFEST_PATH) {
  return loadJson(filePath);
}

export function loadProductPackageManifest(filePath = PRODUCT_PACKAGE_PATH) {
  return loadJson(filePath);
}

export function validateProductManifestConfig(appConfig, packageManifest) {
  const errors = [];
  const expoConfig = appConfig?.expo;

  if (!expoConfig || typeof expoConfig !== 'object') {
    return ['Missing expo config in apps/product-host/app.json.'];
  }

  if (expoConfig.slug !== 'vue-native-product') {
    errors.push('expo.slug must remain "vue-native-product".');
  }

  if (expoConfig.scheme !== 'vue-native-product') {
    errors.push('expo.scheme must remain "vue-native-product".');
  }

  if (expoConfig.android?.package !== 'com.vuenative.product') {
    errors.push('expo.android.package must remain "com.vuenative.product".');
  }

  if (expoConfig.ios?.bundleIdentifier !== 'com.vuenative.product') {
    errors.push('expo.ios.bundleIdentifier must remain "com.vuenative.product".');
  }

  assertExactStringArray(
    expoConfig.android?.permissions,
    REQUIRED_ANDROID_PERMISSIONS,
    'expo.android.permissions',
    errors,
  );

  assertContainsRequiredStrings(
    expoConfig.android?.blockedPermissions,
    REQUIRED_BLOCKED_ANDROID_PERMISSIONS,
    'expo.android.blockedPermissions',
    errors,
  );

  const infoPlist = expoConfig.ios?.infoPlist;
  if (!infoPlist || typeof infoPlist !== 'object') {
    errors.push('expo.ios.infoPlist must exist and declare release policy values.');
  } else {
    if (infoPlist.ITSAppUsesNonExemptEncryption !== false) {
      errors.push('expo.ios.infoPlist.ITSAppUsesNonExemptEncryption must be false.');
    }

    for (const key of FORBIDDEN_IOS_USAGE_DESCRIPTION_KEYS) {
      if (Object.prototype.hasOwnProperty.call(infoPlist, key)) {
        errors.push(`expo.ios.infoPlist must not define ${key} without a permission review.`);
      }
    }
  }

  const directDependencies = Object.keys(packageManifest?.dependencies ?? {});
  const forbiddenDirectDependencies = directDependencies.filter((dependency) =>
    FORBIDDEN_DIRECT_DEPENDENCIES.includes(dependency),
  );

  if (forbiddenDirectDependencies.length > 0) {
    errors.push(
      `apps/product-host/package.json includes sensitive direct dependencies without permission review: ${forbiddenDirectDependencies.join(', ')}`,
    );
  }

  return errors;
}

function assertExactStringArray(actual, expected, label, errors) {
  if (!Array.isArray(actual)) {
    errors.push(`${label} must be an array.`);
    return;
  }

  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();

  if (
    actualSorted.length !== expectedSorted.length ||
    actualSorted.some((value, index) => value !== expectedSorted[index])
  ) {
    errors.push(
      `${label} must exactly match: ${expectedSorted.join(', ')}. Received: ${actualSorted.join(', ') || '(empty)'}.`,
    );
  }
}

function assertContainsRequiredStrings(actual, required, label, errors) {
  if (!Array.isArray(actual)) {
    errors.push(`${label} must be an array.`);
    return;
  }

  const actualSet = new Set(actual);
  const missingValues = required.filter((value) => !actualSet.has(value));

  if (missingValues.length > 0) {
    errors.push(`${label} is missing required blocked permissions: ${missingValues.join(', ')}.`);
  }
}

async function main() {
  const errors = validateProductManifestConfig(
    loadProductManifestConfig(),
    loadProductPackageManifest(),
  );

  if (errors.length > 0) {
    console.error(`[security] Product manifest policy failed with ${errors.length} issue(s):`);
    for (const error of errors) {
      console.error(`[security] - ${error}`);
    }
    process.exit(1);
  }

  console.log('[security] Product manifest permission policy passed.');
}

if (path.resolve(process.argv[1] ?? '') === thisFilePath) {
  main().catch((error) => {
    console.error(`[security] Failed to validate product manifest policy: ${error.message}`);
    process.exit(1);
  });
}
