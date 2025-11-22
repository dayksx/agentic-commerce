import { NextResponse } from 'next/server';
import { queryPayments } from '@/scripts/query-x402-payments';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 50);

    const payments = await queryPayments(limit);

    // Serialize bigint and Date for JSON response
    const serializedPayments = payments.map(payment => ({
      ...payment,
      blockNumber: typeof payment.blockNumber === 'bigint' 
        ? payment.blockNumber.toString() 
        : payment.blockNumber,
      timestamp: payment.timestamp instanceof Date 
        ? payment.timestamp.toISOString() 
        : payment.timestamp,
    }));

    return NextResponse.json(serializedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}