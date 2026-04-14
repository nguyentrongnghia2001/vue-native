import { describe, expect, it } from 'vitest';

import {
  loadProductManifestConfig,
  loadProductPackageManifest,
  REQUIRED_ANDROID_PERMISSIONS,
  validateProductManifestConfig,
} from '../../../scripts/security/validate-product-manifest.mjs';

describe('product manifest permission policy', () => {
  it('accepts the checked-in product-host manifest and package scope', () => {
    const errors = validateProductManifestConfig(
      loadProductManifestConfig(),
      loadProductPackageManifest(),
    );

    expect(errors).toEqual([]);
  });

  it('rejects extra android permissions outside the approved scope', () => {
    const manifestConfig = clone(loadProductManifestConfig());
    const packageManifest = loadProductPackageManifest();

    manifestConfig.expo.android.permissions = [
      ...REQUIRED_ANDROID_PERMISSIONS,
      'android.permission.CAMERA',
    ];

    const errors = validateProductManifestConfig(manifestConfig, packageManifest);

    expect(errors.some((error) => error.includes('expo.android.permissions'))).toBe(true);
  });

  it('rejects sensitive iOS usage descriptions and direct dependencies without review', () => {
    const manifestConfig = clone(loadProductManifestConfig());
    const packageManifest = clone(loadProductPackageManifest());

    manifestConfig.expo.ios.infoPlist.NSCameraUsageDescription = 'Need camera';
    packageManifest.dependencies['expo-camera'] = '^1.0.0';

    const errors = validateProductManifestConfig(manifestConfig, packageManifest);

    expect(errors.some((error) => error.includes('NSCameraUsageDescription'))).toBe(true);
    expect(errors.some((error) => error.includes('expo-camera'))).toBe(true);
  });
});

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
