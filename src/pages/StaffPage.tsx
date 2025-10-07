import { StaffDashboard } from "@/components/staff/StaffDashboard";

const StaffPage = () => {
  return (
    <div className="min-h-screen bg-restaurant-grey-50">
      {/* Header */}
      <header className="restaurant-gradient-bg px-6 py-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-restaurant-white font-display">
            RestoGenie
          </h1>
          <p className="text-restaurant-white/80 text-sm mt-1">
            Staff Interface - Manage Restaurant Operations
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 sm:p-6">
        <StaffDashboard />
      </div>
    </div>
  );
};

export default StaffPage;
