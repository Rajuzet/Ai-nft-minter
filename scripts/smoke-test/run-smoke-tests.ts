import { PrismaClient } from '@prisma/client';
import * as net from 'net';
import * as dotenv from 'dotenv';

dotenv.config();

async function runSmokeTests() {
  console.log('\n🚀 ──────────────────────────────────────────────────────────────');
  console.log('🚀 RUNNING PRODUCTION SMOKE TESTS');
  console.log('🚀 ──────────────────────────────────────────────────────────────\n');

  let overallPassed = true;

  // ─── 1. FRONTEND AVAILABILITY ───────────────────────────────────────────
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  console.log(`[1/5] Checking Frontend Accessibility: ${frontendUrl}...`);
  try {
    const res = await fetch(frontendUrl);
    if (res.ok || res.status === 200 || res.status === 304 || res.status === 404 || res.status === 401) {
      console.log(`   ✓ Frontend is accessible (HTTP status ${res.status})`);
    } else {
      console.warn(`   ⚠ Frontend returned non-standard status: ${res.status}`);
    }
  } catch (err: any) {
    console.error(`   ✗ Frontend is unreachable: ${err.message}`);
    overallPassed = false;
  }

  // ─── 2. BACKEND API & HEALTH ENDPOINTS ──────────────────────────────────
  const backendPort = process.env.PORT || '3001';
  const backendUrl = `http://localhost:${backendPort}`;
  console.log(`\n[2/5] Checking Backend Gateway Health: ${backendUrl}/health...`);
  try {
    const res = await fetch(`${backendUrl}/health`);
    if (res.ok) {
      const data = await res.json();
      console.log(`   ✓ Health endpoint returned HTTP 200: ${JSON.stringify(data)}`);
    } else {
      console.error(`   ✗ Health endpoint returned status: ${res.status}`);
      overallPassed = false;
    }
  } catch (err: any) {
    console.error(`   ✗ Backend is unreachable: ${err.message}`);
    overallPassed = false;
  }

  // ─── 3. DATABASE CRUD & TRANSACTION ────────────────────────────────────
  console.log('\n[3/5] Checking Database Connectivity & CRUD...');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('   ✓ Prisma ORM connected successfully.');

    // Write-Read-Delete isolated smoke test
    const tempUserAddress = `0xsmoke${Math.floor(Math.random() * 1000000)}`;
    const tempUser = await prisma.user.create({
      data: {
        walletAddress: tempUserAddress,
        displayName: 'Smoke Test User',
        username: `smoke_${Date.now()}`,
        role: 'USER',
      },
    });
    console.log(`   ✓ Database write succeeded (created user with ID: ${tempUser.id})`);

    const fetchedUser = await prisma.user.findUnique({
      where: { walletAddress: tempUserAddress },
    });
    if (fetchedUser && fetchedUser.displayName === 'Smoke Test User') {
      console.log('   ✓ Database read/integrity verification passed.');
    } else {
      throw new Error('Fetched user does not match the created user.');
    }

    await prisma.user.delete({
      where: { walletAddress: tempUserAddress },
    });
    console.log('   ✓ Database clean-up/delete check succeeded.');

  } catch (err: any) {
    console.error(`   ✗ Database verification failed: ${err.message}`);
    overallPassed = false;
  } finally {
    await prisma.$disconnect();
  }

  // ─── 4. REDIS CONNECTION ────────────────────────────────────────────────
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`\n[4/5] Checking Redis TCP Connectivity: ${redisUrl}...`);
  try {
    // Parse Redis host and port
    let host = 'localhost';
    let port = 6379;
    
    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      const cleanUrl = redisUrl.replace(/^rediss?:\/\//, '');
      // handle credentials if present: e.g. :password@host:port
      const atIndex = cleanUrl.indexOf('@');
      const connectionPart = atIndex !== -1 ? cleanUrl.substring(atIndex + 1) : cleanUrl;
      const parts = connectionPart.split(':');
      host = parts[0];
      if (parts[1]) {
        port = parseInt(parts[1].split('/')[0], 10);
      }
    }

    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      
      socket.connect(port, host, () => {
        socket.write('PING\r\n');
      });

      socket.on('data', (data) => {
        if (data.toString().includes('PONG') || data.toString().includes('NOAUTH') || data.toString().includes('ERR')) {
          console.log(`   ✓ Redis TCP connection verified (Received: ${data.toString().trim()})`);
          socket.destroy();
          resolve();
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timed out'));
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
  } catch (err: any) {
    console.error(`   ✗ Redis check failed: ${err.message}`);
    overallPassed = false;
  }

  // ─── 5. BLOCKCHAIN RPC NODE ──────────────────────────────────────────────
  const rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';
  console.log(`\n[5/5] Checking Blockchain RPC Connectivity: ${rpcUrl}...`);
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        const blockNum = parseInt(data.result, 16);
        console.log(`   ✓ RPC Node responsive. Latest block number: ${blockNum}`);
      } else {
        throw new Error('RPC returned empty result or error: ' + JSON.stringify(data.error));
      }
    } else {
      throw new Error(`RPC returned HTTP status ${response.status}`);
    }
  } catch (err: any) {
    console.error(`   ✗ RPC verification failed: ${err.message}`);
    overallPassed = false;
  }

  console.log('\n🚀 ──────────────────────────────────────────────────────────────');
  if (overallPassed) {
    console.log('🚀 SMOKE TESTS PASSED SUCCESSFULLY! ALL SYSTEMS OPERATIONAL ✓');
    console.log('🚀 ──────────────────────────────────────────────────────────────\n');
    process.exit(0);
  } else {
    console.error('❌ SMOKE TESTS FAILED! ONE OR MORE CRITICAL SERVICES DEGRADED');
    console.error('❌ ──────────────────────────────────────────────────────────────\n');
    process.exit(1);
  }
}

runSmokeTests();
