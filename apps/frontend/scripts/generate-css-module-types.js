#!/usr/bin/env node

/**
 * CSS Module Type Generator
 *
 * Automatically generates .d.ts files for CSS Modules.
 * Extracts class names from .module.css and .module.less files
 * and creates corresponding TypeScript type definitions.
 *
 * Usage:
 *   node scripts/generate-css-module-types.js
 *   npm run generate:css-types
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==================== Configuration ====================
const SRC_DIR = path.join(__dirname, '../src');
const CSS_MODULE_PATTERN = /\.module\.(css|less)$/;

// Regular expressions to extract class names
const CLASS_NAME_PATTERNS = {
  // LESS/CSS class selector: .className { ... }
  selector: /^\.([a-zA-Z_][a-zA-Z0-9_-]*)\s*(?:{|\()/m,
  // Global pattern for finding all classes
  globalSelector: /^\.([a-zA-Z_][a-zA-Z0-9_-]*)\s*(?:{|\()/gm,
};

// ==================== Utility Functions ====================

/**
 * Extract class names from CSS/LESS content
 */
function extractClassNames(content) {
  const classNames = new Set();
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) continue;

    const match = line.match(CLASS_NAME_PATTERNS.selector);
    if (match && match[1]) {
      classNames.add(match[1]);
    }
  }

  return Array.from(classNames).sort();
}

/**
 * Generate TypeScript declaration for a CSS Module
 */
function generateTypesForModule(filePath, classNames) {
  const relPath = path.relative(SRC_DIR, filePath);
  const fileName = path.basename(filePath);

  const classNamesList = classNames
    .map((name) => `  readonly "${name}": string;`)
    .join('\n');

  const template = `/**
 * CSS Module Type Definitions for ${fileName}
 *
 * ⚠️  This file is auto-generated. Do not edit manually.
 *
 * To regenerate:
 *   npm run generate:css-types
 *
 * Benefits:
 * - ✅ IDE correctly jumps to source file directory
 * - ✅ Autocomplete for CSS class names
 * - ✅ Full type safety
 */

declare const styles: {
${classNamesList}
};

export default styles;
`;

  return template;
}

/**
 * Find all CSS Module files in the source directory
 */
function findCSSModules(dir) {
  const modules = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // Skip node_modules, .next, etc.
      if (
        entry.name.startsWith('.') ||
        entry.name === 'node_modules' ||
        entry.name === '.next'
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (CSS_MODULE_PATTERN.test(entry.name)) {
        modules.push(fullPath);
      }
    }
  }

  walk(dir);
  return modules;
}

/**
 * Check if a file has changed since last generation
 */
function hasFileChanged(modulePath, dtsPath) {
  if (!fs.existsSync(dtsPath)) {
    return true;
  }

  try {
    const moduleStat = fs.statSync(modulePath);
    const dtsStat = fs.statSync(dtsPath);

    // If source file is newer than .d.ts file, it has changed
    return moduleStat.mtime > dtsStat.mtime;
  } catch (error) {
    return true;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for CSS Modules...\n');

  const modules = findCSSModules(SRC_DIR);

  if (modules.length === 0) {
    console.log('✅ No CSS modules found.');
    return;
  }

  console.log(`Found ${modules.length} CSS Module(s):\n`);

  let generated = 0;
  let skipped = 0;

  for (const modulePath of modules) {
    const dtsPath = modulePath + '.d.ts';
    const relPath = path.relative(SRC_DIR, modulePath);

    // Check if file needs regeneration
    if (!hasFileChanged(modulePath, dtsPath)) {
      console.log(`⏭️  Skipped (up-to-date): ${relPath}`);
      skipped++;
      continue;
    }

    try {
      // Read the module file
      const content = fs.readFileSync(modulePath, 'utf-8');

      // Extract class names
      const classNames = extractClassNames(content);

      if (classNames.length === 0) {
        console.log(`⚠️  Warning (no classes found): ${relPath}`);
        skipped++;
        continue;
      }

      // Generate type definitions
      const typesContent = generateTypesForModule(modulePath, classNames);

      // Write .d.ts file
      fs.writeFileSync(dtsPath, typesContent, 'utf-8');

      console.log(
        `✅ Generated (${classNames.length} classes): ${relPath}`,
      );
      console.log(
        `   Classes: ${classNames.slice(0, 3).join(', ')}${classNames.length > 3 ? `, +${classNames.length - 3} more` : ''}`,
      );

      generated++;
    } catch (error) {
      console.error(`❌ Error processing ${relPath}:`, error.message);
    }
  }

  console.log(
    `\n📊 Summary: ${generated} generated, ${skipped} skipped, ${modules.length} total`,
  );

  if (generated > 0) {
    console.log(
      '\n✨ CSS Module type definitions updated successfully!\n',
    );
  }
}

// ==================== Execution ====================
try {
  main();
} catch (error) {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}
