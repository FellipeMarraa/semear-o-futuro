import {Routes} from '@/routes';
import './App.css';
import {Toaster} from './components/ui/toaster';
import {TooltipProvider} from "@/components/ui/tooltip.tsx";
import {AuthProvider} from "@/context/auth-context.tsx";
import {BrowserRouter} from 'react-router-dom';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <TooltipProvider>
                    <Routes />
                    <Toaster />
                </TooltipProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;