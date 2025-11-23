import { NextResponse } from 'next/server';
import { queryPayments, getPaymentBalance } from '@/scripts/query-x402-payments';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 50);

    const [payments, balance] = await Promise.all([
      queryPayments(limit),
      getPaymentBalance(),
    ]);

    const serializedPayments = payments.map(payment => ({
      ...payment,
      blockNumber:
        typeof payment.blockNumber === "bigint"
          ? payment.blockNumber.toString()
          : payment.blockNumber,
      timestamp:
        payment.timestamp instanceof Date
          ? payment.timestamp.toISOString()
          : payment.timestamp,
    }));

    return NextResponse.json({
      payments: serializedPayments,
      balance, // 👈 ADDED HERE
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}