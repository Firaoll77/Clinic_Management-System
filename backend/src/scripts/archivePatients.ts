import { archiveInactivePatients } from '../lib/archiver';
import { prisma } from '../lib/prisma';

/**
 * Archive patients script for cron job execution
 * This script should be run weekly to archive inactive patients
 * 
 * Usage: node dist/scripts/archivePatients.js
 *        or via cron: 0 2 * * 0 node /path/to/backend/dist/scripts/archivePatients.js
 */

async function main() {
  try {
    console.log('Starting patient archiving process...');
    console.log('===================================');
    
    const result = await archiveInactivePatients();
    
    console.log('===================================');
    console.log('Archiving completed successfully!');
    console.log(`Archived ${result.archived} patients`);
    console.log('===================================');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Archiving failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();