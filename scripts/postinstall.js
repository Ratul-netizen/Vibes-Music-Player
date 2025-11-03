#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

if (fs.existsSync(schemaPath)) {
  console.log('Running Prisma generate...');
  try {
    execSync('prisma generate', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Prisma generate failed, but continuing...');
  }
} else {
  console.log('Skipping Prisma generate - schema.prisma not found');
}

