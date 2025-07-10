const fs = require("fs")
const path = require("path")

console.log("Restoring package.json from backup...")

try {
  const packageJsonPath = path.join(__dirname, "..", "package.json")
  const backupPath = path.join(__dirname, "..", "package.json.backup")

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, packageJsonPath)
    console.log("Restoration complete!")
    console.log("\nRun 'npm install' to reinstall previous dependencies")
  } else {
    console.error("Backup file not found at package.json.backup")
  }
} catch (error) {
  console.error("Error during restoration:", error.message)
}
