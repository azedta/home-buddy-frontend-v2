import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import DashboardLayout from "../components/dashboard/DashboardLayout.jsx";

import {RobotPage} from "../pages/dashboard/RobotPage.jsx";
import RobotActivityPage from "../pages/robot/RobotActivityPage";
import MedicationPage from "../pages/dashboard/MedicationPage.jsx";
import NotificationsPage from "../pages/dashboard/NotificationsPage";
import SettingsPage from "../pages/dashboard/SettingsPage";
import DosesSchedulesPage from "../pages/dashboard/DosesSchedulesPage.jsx";
import ElderlyMedicationView from "../pages/medication/ElderlyMedicationView.jsx";



export const router = createBrowserRouter([
    // ✅ public
    { path: "/", element: <LoginPage /> },
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
                    { path: "doses", element: <DosesSchedulesPage /> },
                    { path: "notifications", element: <NotificationsPage /> },
                    { path: "settings", element: <SettingsPage /> },
                ],
            },
        ],
    },
]);
