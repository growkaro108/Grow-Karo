import React from "react";

export default function FieldError({ name, errors, touched }) {
  return touched[name] && errors[name] ? (
    <p className="text-xs text-red-600 mt-1">{errors[name]}</p>
  ) : null;
}
