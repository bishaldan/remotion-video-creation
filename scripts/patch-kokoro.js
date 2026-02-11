const fs = require('fs');
const path = require('path');

const root = process.cwd();
const filesToPatch = [
    path.join(root, 'node_modules', 'kokoro-js', 'dist', 'kokoro.cjs'),
    path.join(root, 'node_modules', 'kokoro-js', 'dist', 'kokoro.js')
];

console.log("🛠️ Patching kokoro-js for Next.js compatibility...");

filesToPatch.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log(`⚠️ Skipping ${file} (not found)`);
        return;
    }

    let content = fs.readFileSync(file, 'utf8');
    
    // Look for the broken dirname resolution
    const cjsTarget = '"undefined"!=typeof __dirname?__dirname:void 0';
    const esmTarget = '"undefined"!=typeof __dirname?__dirname:import.meta.dirname';
    
    // Replace with a robust resolution that falls back to process.cwd()
    const replacement = '("undefined"!=typeof __dirname && __dirname.length > 5)?__dirname:(require("path").join(process.cwd(), "node_modules", "kokoro-js", "dist"))';
    const esmReplacement = '("undefined"!=typeof __dirname && __dirname.length > 5)?__dirname:((typeof import.meta !== "undefined" && import.meta.dirname) || (require("path").join(process.cwd(), "node_modules", "kokoro-js", "dist")))';

    if (content.includes(cjsTarget)) {
        content = content.split(cjsTarget).join(replacement);
        console.log(`✅ Patched CJS: ${path.basename(file)}`);
    } else if (content.includes(esmTarget)) {
        // Since the ESM file might not have 'require', we use a simpler string replace or handle it
        content = content.split(esmTarget).join(esmReplacement);
        console.log(`✅ Patched ESM: ${path.basename(file)}`);
    } else {
        console.log(`ℹ️ ${path.basename(file)} already patched or target not found.`);
        return;
    }

    fs.writeFileSync(file, content);
});

console.log("🚀 kokoro-js patch applied successfully!");
