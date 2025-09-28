import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";

type TableStatus = "available" | "occupied" | "cleaning" | "reserved";

interface Table {
  id: number;
  status: TableStatus;
  seats: number;
  occupiedSince?: string;
  guestCount?: number;
}

const statusConfig = {
  available: {
    label: "Available",
    color: "status-available",
    icon: CheckCircle,
    bgClass: "restaurant-table-available",
  },
  occupied: {
    label: "Occupied",
    color: "status-occupied", 
    icon: Users,
    bgClass: "restaurant-table-occupied",
  },
  cleaning: {
    label: "Cleaning",
    color: "status-cleaning",
    icon: AlertCircle,
    bgClass: "restaurant-table-cleaning",
  },
  reserved: {
    label: "Reserved",
    color: "status-reserved",
    icon: Calendar,
    bgClass: "restaurant-table-reserved",
  },
};

export const TableManagement = () => {
  const [tables, setTables] = useState<Table[]>([
    { id: 1, status: "available", seats: 4 },
    { id: 2, status: "occupied", seats: 2, occupiedSince: "12:30 PM", guestCount: 2 },
    { id: 3, status: "available", seats: 6 },
    { id: 4, status: "cleaning", seats: 4 },
    { id: 5, status: "occupied", seats: 8, occupiedSince: "1:15 PM", guestCount: 6 },
    { id: 6, status: "reserved", seats: 4 },
    { id: 7, status: "available", seats: 2 },
    { id: 8, status: "available", seats: 4 },
    { id: 9, status: "occupied", seats: 6, occupiedSince: "11:45 AM", guestCount: 4 },
    { id: 10, status: "available", seats: 4 },
    { id: 11, status: "available", seats: 2 },
    { id: 12, status: "cleaning", seats: 6 },
  ]);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const updateTableStatus = (tableId: number, newStatus: TableStatus) => {
    setTables(tables.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            status: newStatus,
            occupiedSince: newStatus === "occupied" ? new Date().toLocaleTimeString() : undefined,
            guestCount: newStatus === "occupied" ? table.guestCount || 2 : undefined
          }
        : table
    ));
    setSelectedTable(null);
  };

  const getStatusSummary = () => {
    const summary = tables.reduce(
      (acc, table) => {
        acc[table.status]++;
        return acc;
      },
      { available: 0, occupied: 0, cleaning: 0, reserved: 0 }
    );
    return summary;
  };

  const statusSummary = getStatusSummary();

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(statusSummary).map(([status, count]) => {
        const config = statusConfig[status as TableStatus];
        const Icon = config.icon;
        return (
          <Card key={status} className="restaurant-card">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                status === "available" ? "bg-status-available text-white" :
                status === "occupied" ? "bg-accent text-accent-foreground" :
                status === "cleaning" ? "bg-destructive text-destructive-foreground" :
                "bg-blue-500 text-white"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Table Grid */}
      <Card className="restaurant-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Restaurant Floor Plan</h3>
          <p className="text-muted-foreground">Click on any table to update its status</p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {tables.map((table) => {
            const config = statusConfig[table.status];
            const Icon = config.icon;
            
            return (
              <Dialog key={table.id}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-24 w-full flex flex-col items-center justify-center space-y-2 transition-all duration-200 hover:scale-105 ${
                      table.status === "available" ? "bg-status-available text-white hover:opacity-80" :
                      table.status === "occupied" ? "bg-accent text-accent-foreground hover:opacity-80" :
                      table.status === "cleaning" ? "bg-destructive text-destructive-foreground hover:opacity-80" :
                      "bg-blue-500 text-white hover:opacity-80"
                    }`}
                    onClick={() => setSelectedTable(table)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">T{table.id}</span>
                    <span className="text-xs">{table.seats} seats</span>
                    {table.occupiedSince && (
                      <span className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {table.occupiedSince}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Table {table.id} - {table.seats} seats</DialogTitle>
                    <DialogDescription>
                      <div className="space-y-2">
                        <div>Current status: <Badge variant="secondary">{config.label}</Badge></div>
                        {table.occupiedSince && (
                          <div>Occupied since: {table.occupiedSince}</div>
                        )}
                        {table.guestCount && (
                          <div>Guest count: {table.guestCount}</div>
                        )}
                      </div>
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                      onClick={() => updateTableStatus(table.id, "available")}
                      className="bg-status-available hover:opacity-90 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Available
                    </Button>
                    <Button
                      onClick={() => updateTableStatus(table.id, "occupied")}
                      className="bg-accent hover:opacity-90 text-accent-foreground"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Seat Guests
                    </Button>
                    <Button
                      onClick={() => updateTableStatus(table.id, "cleaning")}
                      className="bg-destructive hover:opacity-90 text-destructive-foreground"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Needs Cleaning
                    </Button>
                    <Button
                      onClick={() => updateTableStatus(table.id, "reserved")}
                      className="bg-blue-500 hover:opacity-90 text-white"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Reserve
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </Card>
    </div>
  );
};