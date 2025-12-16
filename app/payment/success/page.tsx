'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <img
            src="/auvora-logo.png"
            alt="Auvora"
            className="mx-auto h-16 w-16"
          />
          <div className="mt-6">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            ) : (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Payment Successful!
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Thank you for your payment. Your transaction has been completed successfully.
                </p>
                {sessionId && (
                  <p className="mt-2 text-xs text-gray-400">
                    Reference: {sessionId.slice(0, 20)}...
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0f5257] hover:bg-[#0a3d41] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f5257] transition-colors"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/pos"
            className="w-full flex justify-center py-3 px-4 border border-[#0f5257] rounded-lg shadow-sm text-sm font-medium text-[#0f5257] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f5257] transition-colors"
          >
            Process Another Payment
          </Link>
        </div>

        <div className="text-center text-xs text-gray-500 mt-8">
          <p>Powered by Auvora</p>
        </div>
      </div>
    </div>
  );
}
