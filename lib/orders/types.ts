export type OrderInput = {
  serviceType: string;
  serviceDate: string;
  loadingTime: string;
  origin: string;
  destination: string;
  cargoTons: number;
  detail: string | null;
};
