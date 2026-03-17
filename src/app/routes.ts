import { createBrowserRouter } from "react-router";
import HomePage from "../components/HomePage";
import OptimizePage from "../components/OptimizePage";
import PrivacyPage from "../components/legal/PrivacyPage";
import TermsPage from "../components/legal/TermsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/optimize",
    Component: OptimizePage,
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
