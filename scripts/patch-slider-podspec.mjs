import fs from "node:fs";
import path from "node:path";

const podspecPath = path.join(
  process.cwd(),
  "node_modules",
  "@react-native-community",
  "slider",
  "react-native-slider.podspec"
);

function fail(msg) {
  // Keep install resilient; failing postinstall can break EAS builds.
  console.warn(`[postinstall] ${msg}`);
  process.exit(0);
}

if (!fs.existsSync(podspecPath)) {
  fail(`Podspec not found at ${podspecPath}; skipping slider patch.`);
}

let podspec = fs.readFileSync(podspecPath, "utf8");

// Avoid re-patching on repeated installs.
if (podspec.includes("AUTINOTE_PATCH_SLIDER_PODSPEC")) {
  process.exit(0);
}

const originalSourceFilesLine = '  s.source_files = "ios/**/*.{h,m,mm}"';
if (!podspec.includes(originalSourceFilesLine)) {
  fail("Unexpected slider podspec format (source_files); skipping patch.");
}

// Patch rationale:
// - The slider podspec always includes Fabric files, but only conditionally includes the
//   corresponding C++ headers. This can break Xcode builds with:
//   'react/renderer/components/RNCSlider/RNCSliderComponentDescriptor.h' file not found
// - We gate Fabric sources behind RCT_NEW_ARCH_ENABLED and ensure HEADER_SEARCH_PATHS include
//   the library's common/cpp folder when New Architecture is enabled.
podspec = podspec.replace(
  originalSourceFilesLine,
  [
    "  # AUTINOTE_PATCH_SLIDER_PODSPEC",
    "  # Fix iOS builds by gating Fabric sources and ensuring headers are reachable.",
    "  if new_arch_enabled",
    '    s.source_files = "ios/**/*.{h,m,mm}", "common/cpp/**/*.{cpp,h}"',
    "  else",
    '    s.source_files = "ios/RNCSlider.{h,m}"',
    "  end",
  ].join("\n")
);

const subspecBlock = [
  "  if new_arch_enabled",
  '    s.subspec "common" do |ss|',
  '        ss.source_files         = "common/cpp/**/*.{cpp,h}"',
  '        ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\\"$(PODS_TARGET_SRCROOT)/common/cpp\\"" }',
  "    end",
  "  end",
].join("\n");

if (podspec.includes(subspecBlock)) {
  podspec = podspec.replace(subspecBlock + "\n\n", "");
}

const boostHeaderSearch = '"HEADER_SEARCH_PATHS" => "\\"$(PODS_ROOT)/boost\\""';
if (podspec.includes(boostHeaderSearch)) {
  podspec = podspec.replace(
    boostHeaderSearch,
    '"HEADER_SEARCH_PATHS" => "\\"$(PODS_TARGET_SRCROOT)/common/cpp\\" \\"$(PODS_ROOT)/boost\\""'
  );
}

fs.writeFileSync(podspecPath, podspec);
console.log("[postinstall] Patched react-native-slider podspec for iOS builds.");

