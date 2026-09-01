import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api";
import { NotificationIsland } from "@/components/Notification";
import { NotificationProvider } from "@/contexts/NotificationContext";

interface Booking {
  id: number;
  provider: { name: string };
  customer: { name: string };
}

function DashboardPageContent() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["bookings", "mine"],
    queryFn: () => user?.role === 'provider' ? bookingsApi.getByProvider() : bookingsApi.getByCustomer(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div>
      <NotificationIsland />
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard. Here are your current bookings.</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Your Chats</h2>
        {isLoading && <p>Loading bookings...</p>}
        {!isLoading && bookings.length === 0 && <p>You have no active bookings.</p>}
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link href={`/chat/${booking.id}`}>
                <a className="btn-boafo btn-outline" style={{ display: 'block', textAlign: 'left' }}>
                  Chat with {user?.role === 'provider' ? booking.customer.name : booking.provider.name} (Booking #{booking.id})
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <NotificationProvider>
      <DashboardPageContent />
    </NotificationProvider>
  );
}