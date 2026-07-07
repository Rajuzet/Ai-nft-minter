"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage, useChainId } from "wagmi";

export interface SiweUser {
  id: string;
  walletAddress: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
}

export function useSiweAuth() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState<SiweUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  // Check stored auth session on mount or address change
  const checkSession = useCallback(async () => {
    const storedToken = localStorage.getItem("wcos_auth_token");
    if (!storedToken) {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(storedToken);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        // Token expired or invalid
        localStorage.removeItem("wcos_auth_token");
        localStorage.removeItem("wcos_auth_user");
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.warn("SIWE session check failed (backend may be starting up)");
    }
  }, [backendUrl]);

  useEffect(() => {
    checkSession();
  }, [checkSession, address]);

  // Wallet change mismatch check
  useEffect(() => {
    if (isAuthenticated && user && address && address.toLowerCase() !== user.walletAddress.toLowerCase()) {
      setAuthError("Wallet mismatch: Connected wallet differs from signed-in session.");
    } else if (authError?.includes("Wallet mismatch")) {
      setAuthError(null);
    }
  }, [address, isAuthenticated, user, authError]);

  /**
   * Executes full SIWE authentication flow:
   * 1. Fetch nonce from backend
   * 2. Sign SIWE message in wallet
   * 3. Verify signature on backend & receive JWT
   */
  const loginWithSiwe = async () => {
    if (!isConnected || !address) {
      setAuthError("Connect your wallet first before signing in.");
      return;
    }

    setIsSigning(true);
    setAuthError(null);

    try {
      // Step 1: Request Nonce from Backend
      let nonceRes: Response;
      try {
        nonceRes = await fetch(`${backendUrl}/api/v1/auth/nonce?address=${address}`);
      } catch {
        throw new Error("Authentication server unreachable. Verify backend is running on port 4000.");
      }

      if (!nonceRes.ok) {
        throw new Error("Failed to generate authentication nonce from server.");
      }

      const { nonce } = await nonceRes.json();
      if (!nonce) throw new Error("Invalid nonce returned from server.");

      // Step 2: Construct SIWE standard message string
      const domain = typeof window !== "undefined" ? window.location.host : "localhost:3000";
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const statement = "Sign in to AI NFT Studio Collective (WCOS).";
      const issuedAt = new Date().toISOString();

      const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${origin}\nVersion: 1\nChain ID: ${chainId || 84532}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;

      // Step 3: Prompt user to sign message in wallet
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch (err: any) {
        if (err.message?.includes("rejected") || err.message?.includes("User rejected")) {
          throw new Error("Signature request was rejected in wallet.");
        }
        throw new Error(`Wallet signing failed: ${err.message || err}`);
      }

      // Step 4: Send signature & message to backend for verification
      const verifyRes = await fetch(`${backendUrl}/api/v1/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
          nonce,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || "SIWE signature verification failed.");
      }

      // Step 5: Persist token & user session state
      localStorage.setItem("wcos_auth_token", verifyData.token);
      localStorage.setItem("wcos_auth_user", JSON.stringify(verifyData.user));

      setToken(verifyData.token);
      setUser(verifyData.user);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err: any) {
      setAuthError(err.message || "Sign-In with Ethereum failed.");
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    } finally {
      setIsSigning(false);
    }
  };

  /**
   * Logs out current user and clears session token
   */
  const logout = async () => {
    if (address) {
      try {
        await fetch(`${backendUrl}/api/v1/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address }),
        });
      } catch {
        // Non-critical cleanup
      }
    }

    localStorage.removeItem("wcos_auth_token");
    localStorage.removeItem("wcos_auth_user");
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  return {
    user,
    token,
    isAuthenticated,
    isSigning,
    authError,
    loginWithSiwe,
    logout,
  };
}
