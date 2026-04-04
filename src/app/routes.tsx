import { createBrowserRouter } from "react-router";
import HomePage from "../components/HomePage";
import OptimizePage from "../components/OptimizePage";
import PricingPage from "../components/PricingPage";
import AccountPage from "../components/AccountPage";
import PrivacyPage from "../components/legal/PrivacyPage";
import TermsPage from "../components/legal/TermsPage";
import SignInPage from "../components/auth/SignInPage";
import SignUpPage from "../components/auth/SignUpPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/sign-in",
    Component: SignInPage,
  },
  {
    path: "/sign-up",
    Component: SignUpPage,
  },
  {
    path: "/optimize",
    element: (
      <ProtectedRoute>
        <OptimizePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/pricing",
    Component: PricingPage,
  },
  {
    path: "/account",
    element: (
      <ProtectedRoute>
        <AccountPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/privacy",
    Component: PrivacyPage,
  },
  {
    path: "/terms",
    Component: TermsPage,
  },
]);