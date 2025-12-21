import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const podspecPath = join(
  process.cwd(),
  'node_modules',
  '@react-native-community',
  'slider',
  'RNCSlider.podspec'
);

if (!existsSync(podspecPath)) {
  console.log('⚠️  Slider podspec not found, skipping patch');
  process.exit(0);
}

try {
  let content = readFileSync(podspecPath, 'utf8');

  const originalContent = content;

  content = content.replace(
    /s\.source_files\s*=.*$/m,
    `s.source_files = "ios/**/*.{h,m,mm}"

  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.pod_target_xcconfig = {
      "HEADER_SEARCH_PATHS" => "\\"$(PODS_ROOT)/boost\\" \\"$(PODS_ROOT)/RCT-Folly\\" \\"$(PODS_ROOT)/DoubleConversion\\" \\"$(PODS_ROOT)/Headers/Private/React-Core\\" \\"$(PODS_ROOT)/Headers/Public/React-Codegen\\" \\"$(PODS_ROOT)/Headers/Public/ReactCommon\\"",
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++20"
    }
    s.source_files += ", ios/**/*.{cpp}"
  end`
  );

  if (content === originalContent) {
    console.log('⚠️  Slider podspec patch pattern not found - already patched or version changed');
  } else {
    writeFileSync(podspecPath, content, 'utf8');
    console.log('✅ Patched @react-native-community/slider podspec for New Architecture compatibility');
  }
} catch (error) {
  console.error('❌ Failed to patch slider podspec:', error.message);
  process.exit(1);
}
