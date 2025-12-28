import { Outlet, Link } from "react-router-dom";

export default function AppLayout() {
    return (
        <div className="min-h-screen">
            <header className="border-b">
                <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="font-bold">
                        Goosebeoms Ticketing
                    </Link>
                    <nav className="flex gap-4 text-sm">
                        <Link to="/events" className="hover:underline">
                            Events
                        </Link>
                        <Link to="/me/reservations" className="hover:underline">
                            My
                        </Link>
                        <Link to="/login" className="hover:underline">
                            Login
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
}