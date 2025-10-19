import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Clock, CheckCircle, AlertCircle, Calendar, Plus, Minus, Link } from "lucide-react";

type TableStatus = "available" | "occupied" | "cleaning" | "reserved";

interface Table {
  id: number;
  status: TableStatus;
  seats: number;
  occupiedSince?: string;
  guestCount?: number;
  combinedWith?: number[]; // Array of table IDs this table is combined with
  isCombined?: boolean; // Whether this table is part of a combined setup
  availableSeats?: number; // For flexible seating - how many seats are actually available
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
    { id: 1, status: "available", seats: 4, availableSeats: 4 },
    { id: 2, status: "occupied", seats: 2, occupiedSince: "12:30 PM", guestCount: 2, availableSeats: 0 },
    { id: 3, status: "available", seats: 6, availableSeats: 6 },
    { id: 4, status: "cleaning", seats: 4, availableSeats: 4 },
    { id: 5, status: "occupied", seats: 8, occupiedSince: "1:15 PM", guestCount: 6, availableSeats: 2 },
    { id: 6, status: "reserved", seats: 4, availableSeats: 4 },
    { id: 7, status: "available", seats: 2, availableSeats: 2 },
    { id: 8, status: "available", seats: 4, availableSeats: 4 },
    { id: 9, status: "occupied", seats: 6, occupiedSince: "11:45 AM", guestCount: 4, availableSeats: 2 },
    { id: 10, status: "available", seats: 4, availableSeats: 4 },
    { id: 11, status: "available", seats: 2, availableSeats: 2 },
    { id: 12, status: "cleaning", seats: 6, availableSeats: 6 },
  ]);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showSeatingDialog, setShowSeatingDialog] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [selectedTablesForCombining, setSelectedTablesForCombining] = useState<number[]>([]);
  const [allowFlexibleSeating, setAllowFlexibleSeating] = useState(false);

  const updateTableStatus = (tableId: number, newStatus: TableStatus) => {
    setTables(tables.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            status: newStatus,
            occupiedSince: newStatus === "occupied" ? new Date().toLocaleTimeString() : undefined,
            guestCount: newStatus === "occupied" ? table.guestCount || 2 : undefined,
            availableSeats: newStatus === "available" ? table.seats : table.availableSeats || 0
          }
        : table
    ));
    setSelectedTable(null);
  };

  // Find all tables with remaining available seats
  const findAvailableTables = (guestCount: number) => {
    // Get all tables that have available seats (including partially occupied ones)
    const tablesWithSeats = tables.filter(table => 
      table.availableSeats! > 0
    );
    
    // Separate into single tables and combinations
    const singleTables = tablesWithSeats.filter(table => !table.isCombined);
    const combinations = findTableCombinations(guestCount);
    
    // Return both single tables and combinations
    return [...singleTables, ...combinations];
  };

  // Find combinations of tables that can accommodate large groups
  const findTableCombinations = (guestCount: number) => {
    const availableTables = tables.filter(table => table.status === "available");
    const combinations: number[][] = [];
    
    // Try combinations of 2-4 tables
    for (let i = 0; i < availableTables.length; i++) {
      for (let j = i + 1; j < availableTables.length; j++) {
        const totalSeats = availableTables[i].seats + availableTables[j].seats;
        if (totalSeats >= guestCount) {
          combinations.push([availableTables[i].id, availableTables[j].id]);
        }
        
        // Try 3-table combinations
        for (let k = j + 1; k < availableTables.length; k++) {
          const totalSeats3 = availableTables[i].seats + availableTables[j].seats + availableTables[k].seats;
          if (totalSeats3 >= guestCount) {
            combinations.push([availableTables[i].id, availableTables[j].id, availableTables[k].id]);
          }
        }
      }
    }
    
    return combinations;
  };

  // Combine tables for large groups
  const combineTables = (tableIds: number[], guestCount: number) => {
    const totalSeats = tableIds.reduce((sum, id) => {
      const table = tables.find(t => t.id === id);
      return sum + (table?.seats || 0);
    }, 0);

    setTables(tables.map(table => {
      if (tableIds.includes(table.id)) {
        return {
          ...table,
          status: "occupied" as TableStatus,
          occupiedSince: new Date().toLocaleTimeString(),
          guestCount: guestCount,
          combinedWith: tableIds.filter(id => id !== table.id),
          isCombined: true,
          availableSeats: totalSeats - guestCount
        };
      }
      return table;
    }));
    
    setShowSeatingDialog(false);
    setSelectedTablesForCombining([]);
  };

  // Seat guests with flexible seating option
  const seatGuests = (tableId: number, guestCount: number, allowFlexible: boolean = false) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    // Check if there are enough seats
    if (table.availableSeats! < guestCount && !allowFlexible) {
      alert(`Not enough seats! Table ${tableId} only has ${table.availableSeats} available seats for ${guestCount} guests. Enable flexible seating to proceed.`);
      return;
    }

    if (allowFlexible && table.availableSeats! > 0) {
      // Flexible seating - seat guests even if table isn't full
      setTables(tables.map(t => 
        t.id === tableId 
          ? {
              ...t,
              status: "occupied" as TableStatus,
              occupiedSince: new Date().toLocaleTimeString(),
              guestCount: (t.guestCount || 0) + guestCount,
              availableSeats: Math.max(0, t.availableSeats! - guestCount)
            }
          : t
      ));
    } else {
      // Regular seating - only if table can accommodate all guests
      if (table.availableSeats! >= guestCount) {
        setTables(tables.map(t => 
          t.id === tableId 
            ? {
                ...t,
                status: "occupied" as TableStatus,
                occupiedSince: new Date().toLocaleTimeString(),
                guestCount: (t.guestCount || 0) + guestCount,
                availableSeats: t.availableSeats! - guestCount
              }
            : t
        ));
      }
    }
    
    setShowSeatingDialog(false);
    setSelectedTablesForCombining([]);
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900">Restaurant Floor Plan</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Available</span>
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Occupied</span>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Cleaning</span>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Reserved</span>
            </div>
          </div>
          <p className="text-muted-foreground">Click on any table to update its status or seat guests</p>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {tables.map((table) => {
            const config = statusConfig[table.status];
            const Icon = config.icon;
            
            return (
              <Dialog key={table.id}>
                <DialogTrigger asChild>
                  <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 touch-manipulation border-2 relative overflow-hidden min-h-[120px] sm:min-h-[140px] ${
                    table.status === "available" 
                      ? "border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:border-green-400 hover:from-green-100 hover:to-green-200" :
                    table.status === "occupied" 
                      ? "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:border-orange-400 hover:from-orange-100 hover:to-orange-200" :
                    table.status === "cleaning" 
                      ? "border-red-200 bg-gradient-to-br from-red-50 to-red-100 hover:border-red-400 hover:from-red-100 hover:to-red-200" :
                    "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:border-blue-400 hover:from-blue-100 hover:to-blue-200"
                  }`}>
                    {/* Combined Table Indicator */}
                    {table.isCombined && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Link className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                      {/* Header with Icon and Status */}
                      <div className="flex items-center justify-between">
                        <div className={`p-1.5 sm:p-2 rounded-full ${
                          table.status === "available" ? "bg-green-100 text-green-600" :
                          table.status === "occupied" ? "bg-orange-100 text-orange-600" :
                          table.status === "cleaning" ? "bg-red-100 text-red-600" :
                          "bg-blue-100 text-blue-600"
                        }`}>
                          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-2 py-1 ${
                            table.status === "available" ? "bg-green-100 text-green-700" :
                            table.status === "occupied" ? "bg-orange-100 text-orange-700" :
                            table.status === "cleaning" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {config.label}
                        </Badge>
                      </div>

                      {/* Table ID */}
                      <div className="text-center">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Table {table.id}</h3>
                      </div>

                      {/* Seats Information */}
                      <div className="text-center space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-700">
                          {table.isCombined ? `${table.seats} seats (combined)` : `${table.seats} seats`}
                        </div>
                        {table.status === "occupied" && table.availableSeats! > 0 && (
                          <div className="text-xs text-orange-600 font-medium">
                            {table.availableSeats} available
                          </div>
                        )}
                        {table.status === "occupied" && table.guestCount && (
                          <div className="text-xs text-gray-500">
                            {table.guestCount} guests
                          </div>
                        )}
                      </div>

                      {/* Time Information */}
                      {table.occupiedSince && (
                        <div className="flex items-center justify-center space-x-1 pt-1 sm:pt-2 border-t border-gray-200">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600 font-medium">
                            {table.occupiedSince}
                          </span>
                        </div>
                      )}

                      {/* Combined Tables Indicator */}
                      {table.isCombined && table.combinedWith && (
                        <div className="text-xs text-center text-gray-500 bg-gray-100 rounded px-2 py-1">
                          Combined with T{table.combinedWith.join(", T")}
                        </div>
                      )}
                    </div>
                  </Card>
                </DialogTrigger>

                <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
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
                        {table.availableSeats !== undefined && (
                          <div>Available seats: {table.availableSeats}</div>
                        )}
                        {table.isCombined && table.combinedWith && (
                          <div>Combined with: Tables {table.combinedWith.join(", ")}</div>
                        )}
                      </div>
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    {/* Quick Status Changes */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => updateTableStatus(table.id, "available")}
                        className="bg-status-available hover:opacity-90 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Available
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedTable(table);
                          setShowSeatingDialog(true);
                        }}
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

                    {/* Large Group Seating */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Large Group (6+ people)</h4>
                      <Button
                        onClick={() => {
                          setSelectedTable(table);
                          setShowSeatingDialog(true);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Combine Tables for Large Group
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </Card>

      {/* Seating Dialog */}
      <Dialog open={showSeatingDialog} onOpenChange={setShowSeatingDialog}>
        <DialogContent className="max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seat Guests</DialogTitle>
            <DialogDescription>
              Configure seating for your guests
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Guest Count */}
            <div className="space-y-2">
              <Label htmlFor="guestCount">Number of Guests</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="guestCount"
                  type="number"
                  min="1"
                  max="20"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Flexible Seating Option */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="flexibleSeating"
                  checked={allowFlexibleSeating}
                  onChange={(e) => setAllowFlexibleSeating(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="flexibleSeating">
                  Allow flexible seating (seat guests even if table isn't full)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Guests will be seated even if there are 1-2 empty seats remaining
              </p>
            </div>

            {/* Available Tables */}
            <div className="space-y-2">
              <Label>Select Table(s) - All tables with available seats</Label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {findAvailableTables(guestCount).map((table) => {
                  const isSelected = Array.isArray(table) 
                    ? selectedTablesForCombining.length === table.length && 
                      table.every(id => selectedTablesForCombining.includes(id))
                    : selectedTablesForCombining.includes(table.id);
                  
                  const isArray = Array.isArray(table);
                  const tableInfo = isArray ? {
                    ids: table,
                    totalSeats: table.reduce((sum, id) => {
                      const t = tables.find(tbl => tbl.id === id);
                      return sum + (t?.seats || 0);
                    }, 0),
                    availableSeats: table.reduce((sum, id) => {
                      const t = tables.find(tbl => tbl.id === id);
                      return sum + (t?.availableSeats || 0);
                    }, 0)
                  } : {
                    ids: [table.id],
                    totalSeats: table.seats,
                    availableSeats: table.availableSeats || 0
                  };

                  return (
                    <Button
                      key={isArray ? table.join('-') : table.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isArray) {
                          // This is a combination
                          setSelectedTablesForCombining(table);
                        } else {
                          // Single table
                          setSelectedTablesForCombining([table.id]);
                        }
                      }}
                      className="justify-start h-auto p-3"
                    >
                      <div className="flex flex-col items-start w-full">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">
                            {isArray ? `Tables ${table.join(", ")}` : `Table ${table.id}`}
                          </span>
                          <Badge variant={isSelected ? "default" : "secondary"}>
                            {isSelected ? "Selected" : "Available"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {tableInfo.availableSeats} of {tableInfo.totalSeats} seats available
                          {!isArray && table.status === "occupied" && (
                            <span className="ml-2 text-orange-600">
                              (Currently occupied by {table.guestCount} guests)
                            </span>
                          )}
                        </div>
                        {guestCount > tableInfo.availableSeats && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️ Not enough seats for {guestCount} guests
                          </div>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
              {findAvailableTables(guestCount).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No tables with available seats found
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {selectedTablesForCombining.length > 0 && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium mb-1">Selected Table(s):</div>
                <div className="text-sm text-muted-foreground">
                  {selectedTablesForCombining.length === 1 ? (
                    `Table ${selectedTablesForCombining[0]}`
                  ) : (
                    `Tables ${selectedTablesForCombining.join(", ")} (Combined)`
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  if (selectedTablesForCombining.length > 1) {
                    combineTables(selectedTablesForCombining, guestCount);
                  } else if (selectedTablesForCombining.length === 1) {
                    seatGuests(selectedTablesForCombining[0], guestCount, allowFlexibleSeating);
                  }
                }}
                disabled={selectedTablesForCombining.length === 0}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                {selectedTablesForCombining.length === 0 
                  ? "Select a table first" 
                  : `Seat ${guestCount} Guest${guestCount > 1 ? 's' : ''}`
                }
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSeatingDialog(false);
                  setSelectedTablesForCombining([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};