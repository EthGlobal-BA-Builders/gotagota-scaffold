"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  const handleBackHome = () => {
    router.push("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
      <div className="w-full max-w-2xl px-5 flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="flex relative w-40 h-20">
          <Image alt="Logo" className="cursor-pointer" fill src="/logo.png" />
        </div>

        {/* Congratulations Message */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold uppercase">CONGRATULATIONS</h1>
          <p className="text-xl text-gray-700">your setup is completed</p>
        </div>

        {/* Back Home Button */}
        <button
          onClick={handleBackHome}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white py-6 text-lg font-semibold rounded-2xl btn"
        >
          Back Home
        </button>
      </div>
    </div>
  );
}
