/** This file is intended to solve the routing problem related to Link to "/"
    It should route the user to their respective dashboard. It also makes the login portal
    inaccessible to logged in users. 
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getHomePath } from "@/lib/getHomePath";
import HomePage from "@/pages/HomePage";

export default function HomeGate() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (profile) {
    return <Navigate to={getHomePath(profile.role)} replace />;
  }

  return <HomePage />;
}