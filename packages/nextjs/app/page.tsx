"use client";

import { PayrollForm } from "~~/components/payroll-form";

const Home = () => {
  return (
    <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
      <div className="w-full max-w-2xl px-5">
        <PayrollForm />
      </div>
    </div>
  );
};

export default Home;
