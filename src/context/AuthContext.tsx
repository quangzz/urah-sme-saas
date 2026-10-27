"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged, User, signInWithPopup, signOut } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      console.warn("Firebase is not configured. Auth is bypassed. Use the demo login.");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser && db) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          
          // Align with UserProfile schema
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            globalSubscription: {
              plan: "Free",
              status: "active"
            },
            workspaces: arrayUnion(currentUser.uid), // Default workspace ID is UID
            lastLoginAt: serverTimestamp(),
            createdAt: serverTimestamp(), // Only set if not exists via merge
          }, { merge: true });

          // Enroll user into their own dedicated workspace
          const workspaceRef = doc(db, "workspaces", currentUser.uid);
          await setDoc(workspaceRef, {
            id: currentUser.uid,
            companyName: `${currentUser.displayName || 'My'} Company`,
            memberIds: arrayUnion(currentUser.uid),
            members: { [currentUser.uid]: "Owner" },
            aiQuota: { used: 0, limit: 50 },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Error saving user data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      // Demo Login Mode
      setUser({
        uid: "demo-account-123",
        email: "demo@urahsme.vn",
        displayName: "SME Admin",
        photoURL: "",
      } as User);
      return;
    }
    try {
      if (!googleProvider) throw new Error("Firebase not configured");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  const logout = async () => {
    if (!auth) {
      setUser(null);
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
