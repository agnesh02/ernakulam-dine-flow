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
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('staffInfo', JSON.stringify(response.staff));
          onLogin();
        } catch (err: any) {
          setError(err.message || "Invalid PIN");
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
    <div className="min-h-[500px] flex items-center justify-center">
      <Card className="restaurant-card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="restaurant-gradient-bg w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-restaurant-white" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Staff Access</h2>
          <p className="text-muted-foreground">Enter your 4-digit PIN to continue</p>
          <p className="text-xs text-muted-foreground mt-2">Demo PIN: 1234</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 ${
                  pin.length > index
                    ? "bg-accent border-accent"
                    : "border-restaurant-grey-300"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="text-center mb-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm font-medium">Signing in...</p>
            </div>
          </div>
        )}

        {/* PIN Keypad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <Button
              key={number}
              variant="outline"
              size="lg"
              className="h-16 text-xl font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-200"
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
            className="h-16 text-xl font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            onClick={() => handleNumberClick("0")}
            disabled={isLoading}
          >
            0
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-16 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Delete className="h-6 w-6" />
          </Button>
        </div>
      </Card>
    </div>
  );
};