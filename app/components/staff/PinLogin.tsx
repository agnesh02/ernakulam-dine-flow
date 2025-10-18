import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Delete, Loader2 } from "lucide-react";
import { authAPI } from "@/lib/api";

interface PinLoginProps {
  onLogin: () => void;
}

export const PinLogin = ({ onLogin }: PinLoginProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNumberClick = async (number: string) => {
    if (pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setIsLoading(true);
        try {
          const response = await authAPI.login(newPin);
          // Store auth token and staff info
          if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('staffInfo', JSON.stringify(response.staff));
          }
          onLogin();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Invalid PIN";
          setError(errorMessage);
          setTimeout(() => {
            setPin("");
            setError("");
          }, 1500);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-restaurant-grey-50 to-restaurant-grey-100 z-50 flex flex-col">
      {/* Header */}
      <header className="restaurant-gradient-bg px-6 py-4 shadow-lg flex-shrink-0">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-restaurant-white font-display">
            RestoGenie
          </h1>
          <p className="text-restaurant-white/80 text-sm mt-1">
            Staff Interface - Manage Restaurant Operations
          </p>
        </div>
      </header>

      {/* PIN Login Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="restaurant-card h-full max-h-fit w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm flex flex-col">
        <div className="text-center mb-8 flex-shrink-0">
          <div className="restaurant-gradient-bg w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock className="h-10 w-10 text-restaurant-white" />
          </div>
          <h2 className="text-3xl font-bold text-primary mb-3">Staff Access</h2>
          <p className="text-muted-foreground text-lg mb-3">Enter your 4-digit PIN to continue</p>
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 inline-block">
            <p className="text-sm text-blue-700 font-medium">Demo PIN: <span className="font-mono font-bold">1234</span></p>
          </div> */}
        </div>

        {/* PIN Display */}
        <div className="flex justify-center mb-8 flex-shrink-0">
          <div className="flex space-x-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                  pin.length > index
                    ? "bg-accent border-accent shadow-lg scale-110"
                    : "border-restaurant-grey-300 bg-white"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="text-center mb-4 flex-shrink-0">
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <p className="text-red-700 text-xs font-medium">{error}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center mb-4 flex-shrink-0">
            <div className="flex items-center justify-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-primary text-sm font-medium">Signing in...</p>
            </div>
          </div>
        )}

        {/* PIN Keypad */}
        <div className="grid grid-cols-3 gap-4 mb-6 flex-grow flex items-end">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <Button
              key={number}
              variant="outline"
              size="lg"
              className="h-14 text-xl font-bold hover:bg-accent hover:text-accent-foreground hover:scale-105 transition-all duration-200 shadow-md border-2 hover:shadow-lg"
              onClick={() => handleNumberClick(number.toString())}
              disabled={isLoading}
            >
              {number}
            </Button>
          ))}
          <div /> {/* Empty space */}
          <Button
            variant="outline"
            size="lg"
            className="h-14 text-xl font-bold hover:bg-accent hover:text-accent-foreground hover:scale-105 transition-all duration-200 shadow-md border-2 hover:shadow-lg"
            onClick={() => handleNumberClick("0")}
            disabled={isLoading}
          >
            0
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 hover:bg-red-500 hover:text-white hover:scale-105 transition-all duration-200 shadow-md border-2 hover:shadow-lg"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Delete className="h-6 w-6" />
          </Button>
        </div>
        </Card>
      </div>
    </div>
  );
};