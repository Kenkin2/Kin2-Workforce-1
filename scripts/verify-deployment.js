#!/usr/bin/env node

import http from 'http';
import https from 'https';

const BASE_URL = process.env.APP_URL || 'http://localhost:5000';

const healthChecks = [
  { path: '/health', description: 'Application Health' },
  { path: '/api/auth/user', description: 'Authentication API' },
  { path: '/api/jobs', description: 'Jobs API' },
  { path: '/api/dashboard/stats', description: 'Dashboard Statistics' },
];

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const requestLib = url.startsWith('https') ? https : http;
    const req = requestLib.get(url, (res) => {
      resolve({
        status: res.statusCode,
        success: res.statusCode < 400
      });
    });
    
    req.on('error', () => {
      resolve({
        status: 0,
        success: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 0,
        success: false
      });
    });
  });
}

async function verifyDeployment() {
  console.log('🔍 Verifying deployment health...');
  console.log(`Base URL: ${BASE_URL}`);
  
  let allPassed = true;
  
  for (const check of healthChecks) {
    const url = `${BASE_URL}${check.path}`;
    const result = await checkEndpoint(url);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${check.description}: ${result.status || 'timeout'}`);
    
    if (!result.success) {
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('\n🎉 All health checks passed! Deployment verified.');
    process.exit(0);
  } else {
    console.log('\n❌ Some health checks failed. Check logs above.');
    process.exit(1);
  }
}

verifyDeployment();