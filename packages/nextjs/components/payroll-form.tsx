"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function PayrollForm() {
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("2021-06-24");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Aquí se enviará el archivo al backend cuando esté disponible
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (_file: File) => {
    // Esta función estará lista para cuando el backend esté disponible
    // const formData = new FormData()
    // formData.append("file", file)
    //
    // try {
    //   const response = await fetch("/api/upload-payroll", {
    //     method: "POST",
    //     body: formData,
    //   })
    //   const data = await response.json()
    //   // Manejar la respuesta del backend
    // } catch (error) {
    //   console.error("Error uploading file:", error)
    // }
  };

  const handleVerify = () => {
    console.log("Verifying payroll:", { duration, startDate, file: selectedFile?.name });
    router.push("/summary");
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-pink-50 rounded-lg p-6 border border-pink-100 space-y-4">
        <h2 className="text-2xl font-bold text-pink-600 text-center">Upload the payroll excel</h2>

        <div className="flex flex-col items-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls"
            className="hidden"
            id="file-upload"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold btn"
          >
            Choose Excel File
          </button>
          {selectedFile && (
            <p className="text-sm text-gray-700">
              Selected: <span className="font-semibold">{selectedFile.name}</span>
            </p>
          )}
        </div>

        <p className="text-center">
          <a href="#" className="text-gray-600 hover:text-gray-800 text-sm underline">
            Download the payroll template
          </a>
        </p>
      </div>

      {/* Duration Input */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium text-sm">Duration (in months):</label>
        <input
          type="number"
          placeholder="Enter duration"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="w-full input input-bordered border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Date Input */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium text-sm">Choose the payroll start date</label>
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full input input-bordered border-blue-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white py-6 text-lg font-semibold rounded-2xl mt-8 btn"
      >
        Verify Payroll Information
      </button>
    </div>
  );
}
