import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app-shell";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
