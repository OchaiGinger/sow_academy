"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      router.push("/");
    } catch (err: any) {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-sm p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="text-primary text-4xl font-black tracking-tighter mb-1">AcademiaFlow</div>
          <div className="text-text-secondary text-xs uppercase tracking-widest font-semibold">Terminal Access</div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-text-secondary text-2xs uppercase font-bold">Email Address</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="bg-bg-input border-border-default focus:border-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary text-2xs uppercase font-bold">Password</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="bg-bg-input border-border-default focus:border-primary/50"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary text-bg-base hover:bg-accent-dim font-bold" 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authenticate"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-subtle text-center">
          <p className="text-text-tertiary text-2xs uppercase tracking-wider">
            Enterprise School Records Management System
          </p>
        </div>
      </div>
    </div>
  );
}
