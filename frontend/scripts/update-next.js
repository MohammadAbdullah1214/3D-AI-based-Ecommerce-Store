const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("Starting Next.js update process...")

// Backup package.json before making changes
try {
  const packageJsonPath = path.join(__dirname, "..", "package.json")
  const backupPath = path.join(__dirname, "..", "package.json.backup")

  console.log("Creating backup of package.json...")
  fs.copyFileSync(packageJsonPath, backupPath)
  console.log("Backup created at package.json.backup")

  console.log("\nUpdating Next.js and related dependencies...")
  // Update Next.js and related packages
  execSync("npm install next@latest react@latest react-dom@latest eslint-config-next@latest", { stdio: "inherit" })

  console.log("\nClearing Next.js cache...")
  try {
    execSync("npx next clear", { stdio: "inherit" })
  } catch (e) {
    console.log("Note: 'next clear' command not available, using manual cache clearing...")
    // Fallback to manual cache clearing
    const cacheDir = path.join(__dirname, "..", ".next")
    if (fs.existsSync(cacheDir)) {
      console.log("Removing .next directory...")
      if (process.platform === "win32") {
        execSync(`rmdir /s /q "${cacheDir}"`, { stdio: "inherit" })
      } else {
        execSync(`rm -rf "${cacheDir}"`, { stdio: "inherit" })
      }
    }
  }

  console.log("\nClearing node_modules/.cache...")
  const nodeModulesCacheDir = path.join(__dirname, "..", "node_modules", ".cache")
  if (fs.existsSync(nodeModulesCacheDir)) {
    if (process.platform === "win32") {
      execSync(`rmdir /s /q "${nodeModulesCacheDir}"`, { stdio: "inherit" })
    } else {
      execSync(`rm -rf "${nodeModulesCacheDir}"`, { stdio: "inherit" })
    }
  }

  console.log("\nUpdate completed successfully!")
  console.log("\nNext steps:")
  console.log("1. Run 'npm run dev' to start your development server")
  console.log("2. Test your application thoroughly")
  console.log("3. If you encounter issues, restore from backup with 'node scripts/restore-backup.js'")
} catch (error) {
  console.error("\nError during update process:", error.message)
  console.log("\nYou can restore from backup with 'node scripts/restore-backup.js' if needed")
}
