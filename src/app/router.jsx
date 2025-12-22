import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import DashboardLayout from "../components/DashboardLayout";

import RobotPage from "../pages/dashboard/RobotPage";
import RobotActivityPage from "../pages/robot/RobotActivityPage";
import MedicationPage from "../pages/dashboard/MedicationPage";
import NotificationsPage from "../pages/dashboard/NotificationsPage";
import AnalyticsPage from "../pages/dashboard/AnalyticsPage";
import SettingsPage from "../pages/dashboard/SettingsPage";

export const router = createBrowserRouter([
    // ✅ public
    { path: "/", element: <SignupPage /> },
    { path: "/signup", element: <SignupPage /> },
    { path: "/login", element: <LoginPage /> },

    // 🔒 everything below requires login
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: "/dashboard",
                element: <DashboardLayout />,
                children: [
                    { index: true, element: <RobotPage /> },

                    { path: "robot", element: <RobotPage /> },
                    { path: "robot/activity", element: <RobotActivityPage /> },

                    { path: "medication", element: <MedicationPage /> },
                    { path: "notifications", element: <NotificationsPage /> },
                    { path: "analytics", element: <AnalyticsPage /> },
                    { path: "settings", element: <SettingsPage /> },
                ],
            },
        ],
    },
]);
