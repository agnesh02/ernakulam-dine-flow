"use client";

import React from "react";
import { CustomerApp } from "@/components/customer/CustomerApp";

export const dynamic = 'force-dynamic';

export default function CustomerPage() {
  return (
    <div className="min-h-screen bg-restaurant-grey-50">
      {/* Header */}
      <header className="restaurant-gradient-bg px-6 py-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-restaurant-white font-display">
            RestoGenie
          </h1>
          <p className="text-restaurant-white/80 text-sm mt-1">
            Customer Interface - Order & Enjoy
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 sm:p-6">
        <CustomerApp />
      </div>
    </div>
  );
}

