function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDateValue(date: Date): string {
  const day = padDatePart(date.getDate());
  const month = padDatePart(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatTimeValue(date: Date): string {
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());

  return `${hours}:${minutes}`;
}
