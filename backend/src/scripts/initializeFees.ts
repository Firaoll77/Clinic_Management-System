import { FeeService } from '../lib/feeService';

async function initializeFees() {
  try {
    await FeeService.initializeDefaultFees();
    console.log('Default fee configurations initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing fees:', error);
    process.exit(1);
  }
}

initializeFees();
