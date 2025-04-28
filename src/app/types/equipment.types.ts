export type Equipment = {
  id: number;
  userId: string;
  name: string;
  brand: string;
  model?: string;
  description?: string;
  imageUrl?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  fuelType?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  maintenanceRecords: EquipmentMaintenance[];
};

export type EquipmentMaintenance = {
  id: number;
  maintenanceDate: Date;
  notes: string;
  cost?: number;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  equipmentId?: number;
};
