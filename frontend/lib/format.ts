const vndFormatter = new Intl.NumberFormat("vi-VN");

export const formatVnd = (value?: number | null) => {
  if (!Number.isFinite(value)) {
    return "0 đ";
  }
  const rounded = Math.round(Number(value));
  return `${vndFormatter.format(rounded)} đ`;
};

export const formatVndRange = (min?: number | null, max?: number | null) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }
  if (Number(min) === Number(max)) {
    return formatVnd(min);
  }
  return `${formatVnd(min)} - ${formatVnd(max)}`;
};
