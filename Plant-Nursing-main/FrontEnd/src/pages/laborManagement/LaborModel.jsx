/*
File: src/components/common/LaborModal.jsx
Description: Modal wrapper to display content in a centered overlay.
*/
import React from "react";

const LaborModal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button onClick={onClose}>&times;</button>
      </div>
      {children}
    </div>
  </div>
);

export default LaborModal;
