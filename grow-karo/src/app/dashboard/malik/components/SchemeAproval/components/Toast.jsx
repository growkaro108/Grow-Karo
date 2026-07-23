import React from "react";

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className={`sea-toast sea-toast-${toast.type}`} role="status">
      {toast.text}
    </div>
  );
}
