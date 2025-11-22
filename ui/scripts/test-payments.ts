import { queryPayments } from './query-x402-payments';

async function test() {
  console.log('🧪 Testing queryPayments function...\n');
  
  try {
    const payments = await queryPayments(10);
    
    console.log(`✅ Success! Found ${payments.length} payments\n`);
    
    if (payments.length > 0) {
      console.log('Sample payment:');
      const sample = {
        ...payments[0],
        blockNumber: payments[0].blockNumber.toString(),
        timestamp: payments[0].timestamp.toISOString(),
      };
      console.log(JSON.stringify(sample, null, 2));
    } else {
      console.log('No payments found (this is okay if there are no recent transactions)');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();

