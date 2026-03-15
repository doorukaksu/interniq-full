import { createBrowserRouter } from "react-router";
import HomePage from "../components/HomePage";
import OptimizePage from "../components/OptimizePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/optimize",
    Component: OptimizePage,
  },
]);
