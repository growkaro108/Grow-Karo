export const currency = (value) => {
  if (value === undefined || value === null) return "-";
  return `Rs ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
};

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};
