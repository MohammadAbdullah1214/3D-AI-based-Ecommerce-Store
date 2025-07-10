// This is a script to update the package.json file with compatible versions
// Run this with: node scripts/update-dependencies.js

const fs = require("fs")
const path = require("path")

// Path to package.json
const packageJsonPath = path.join(__dirname, "..", "package.json")

// Read the package.json file
const packageJson = require(packageJsonPath)

// Update the dependencies
packageJson.dependencies = {
  ...packageJson.dependencies,
  three: "^0.160.0", // Make sure this is the latest version
  "three-mesh-bvh": "^0.6.8", // Use a version compatible with Three.js 0.160.0
}

// Write the updated package.json file
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8")

console.log("Dependencies updated successfully!")
console.log('Run "npm install" to install the updated dependencies.')
