export type AppView =
  | "SELECT_MODE"
  | "TOTEM_WELCOME"
  | "TOTEM_REGISTER"
  | "TOTEM_BIOMETRY"
  | "TOTEM_SELECTION"
  | "TV"
  | "ADMIN_AUTH"
  | "ADMIN_DASHBOARD"
  | "BARBER_AUTH"
  | "BARBER_DASHBOARD";

export interface Barber {
  id: string;
  name: string;
  matricula: string;
  status: "available" | "busy";
  isAdminChair: boolean;
}

export interface Customer {
  id: string;
  name: string;
  cpf?: string;
  whatsapp?: string;
  arrivalTime: string;
  preferredBarberId: string | "none";
  status: "waiting" | "service";
}

export interface HistoryItem {
  id: string;
  customerName: string;
  barberName: string;
  finishTime: string;
}
