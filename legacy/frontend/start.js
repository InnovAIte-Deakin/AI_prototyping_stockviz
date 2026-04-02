#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Check if .env exists, if not copy from .env.example
const envPath = path.join(__dirname, '.env')
const envExamplePath = path.join(__dirname, '.env.example')

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('Creating .env from .env.example...')
  fs.copyFileSync(envExamplePath, envPath)
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules')
if (!fs.existsSync(nodeModulesPath)) {
  console.log('Installing dependencies...')
  const install = spawn('npm', ['install'], { stdio: 'inherit', shell: true })
  install.on('close', (code) => {
    if (code === 0) {
      startDev()
    } else {
      console.error('Failed to install dependencies')
      process.exit(1)
    }
  })
} else {
  startDev()
}

function startDev() {
  console.log('Starting development server...')
  const dev = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true })
  
  dev.on('close', (code) => {
    console.log(`Development server exited with code ${code}`)
  })
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...')
    dev.kill('SIGINT')
    process.exit(0)
  })
}
