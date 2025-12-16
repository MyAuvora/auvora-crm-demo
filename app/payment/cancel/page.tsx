'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
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
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Payment Cancelled
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your payment was cancelled. No charges were made to your account.
            </p>
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
            Try Again
          </Link>
        </div>

        <div className="text-center text-xs text-gray-500 mt-8">
          <p>Powered by Auvora</p>
        </div>
      </div>
    </div>
  );
}
