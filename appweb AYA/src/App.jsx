import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";

// Páginas
import AdminDashboard from "./Pages/AdminDashboard";
import StudentDashboard from "./Pages/StudentDashboard";
import Profile from "./Pages/Profile";
import Sessions from "./Pages/Sessions";
import SessionsManagement from "./Pages/SessionsManagement";
import StudentsManagement from "./Pages/StudentsManagement";
import Teachers from "./Pages/Teachers";
import TeachersManagement from "./Pages/TeachersManagement";
import Locations from "./Pages/Locations";
import LocationsManagement from "./Pages/LocationsManagement";
import Events from "./Pages/Events";
import EventsManagement from "./Pages/EventsManagement";
import AttendanceManagement from "./Pages/AttendanceManagement";
import Reports from "./Pages/Reports";
import Chat from "./Pages/Chat";

export default function App() {
  return (
    <Layout currentPageName="Dashboard">
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/sessions-management" element={<SessionsManagement />} />
        <Route path="/students-management" element={<StudentsManagement />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/teachers-management" element={<TeachersManagement />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/locations-management" element={<LocationsManagement />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events-management" element={<EventsManagement />} />
        <Route path="/attendance-management" element={<AttendanceManagement />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Layout>
  );
}
