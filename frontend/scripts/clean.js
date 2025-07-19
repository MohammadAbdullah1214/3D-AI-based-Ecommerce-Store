const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Paths to clean
const pathsToClean = [".next", "node_modules/.cache"]

// Clean the paths
pathsToClean.forEach((pathToClean) => {
  const fullPath = path.join(__dirname, "..", pathToClean)

  if (fs.existsSync(fullPath)) {
    console.log(`Removing ${pathToClean}...`)
    try {
      if (process.platform === "win32") {
        // On Windows, use rimraf for better compatibility
        execSync(`npx rimraf ${fullPath}`)
      } else {
        // On Unix-like systems, use rm -rf
        execSync(`rm -rf ${fullPath}`)
      }
      console.log(`Successfully removed ${pathToClean}`)
    } catch (error) {
      console.error(`Error removing ${pathToClean}:`, error.message)
    }
  } else {
    console.log(`${pathToClean} does not exist, skipping...`)
  }
})

console.log("Cleanup complete!")
console.log('Now run "npm install" followed by "npm run dev" to restart your development server.')
