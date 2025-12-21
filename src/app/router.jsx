import { createBrowserRouter } from "react-router-dom";
import SignupPage from "../pages/auth/SignupPage.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";

import DashboardLayout from "../components/DashboardLayout.jsx";
import RobotPage from "../pages/dashboard/RobotPage";
import MedicationPage from "../pages/dashboard/MedicationPage";
import NotificationsPage from "../pages/dashboard/NotificationsPage";
import AnalyticsPage from "../pages/dashboard/AnalyticsPage";
import SettingsPage from "../pages/dashboard/SettingsPage";

export const router = createBrowserRouter([
    { path: "/", element: <SignupPage /> },
    { path: "/signup", element: <SignupPage /> },
    { path: "/login", element: <LoginPage /> },

    {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
            { index: true, element: <RobotPage /> },
            { path: "robot", element: <RobotPage /> },
            { path: "medication", element: <MedicationPage /> },
            { path: "notifications", element: <NotificationsPage /> },
            { path: "analytics", element: <AnalyticsPage /> },
            { path: "settings", element: <SettingsPage /> },
        ],
    },
]);
