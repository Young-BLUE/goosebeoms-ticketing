import {BrowserRouter, Route, Routes} from "react-router-dom";
import {HomePage} from "./pages/HomePage.tsx";
import {ShowPage} from "./pages/ShowPage.tsx";
import {LoginPageWrapper} from "./pages/LoginPageWrapper.tsx";
import {EventsPageWrapper} from "./pages/EventsPageWrapper.tsx";
import {MyPageWrapper} from "./pages/MyPageWrapper.tsx";
import {AppProvider} from "./contexts/AppContexts.tsx";

export function App() {
    return (
        <BrowserRouter>
            <AppProvider>
                <div className="min-h-screen bg-gray-50">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/show/:id" element={<ShowPage />} />
                        <Route path="/login" element={<LoginPageWrapper />} />
                        <Route path="/mypage" element={<MyPageWrapper />} />
                        <Route path="/events" element={<EventsPageWrapper />} />
                    </Routes>
                </div>
            </AppProvider>
        </BrowserRouter>
    );
}