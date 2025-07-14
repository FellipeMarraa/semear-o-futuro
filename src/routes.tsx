import Dashboard from "@/pages/dashboard.tsx";
import LoginScreen from "@/components/auth/login-screen.tsx";
import {useAuth} from "@/context/auth-context.tsx";

export const Routes = () => {
    const { user } = useAuth();

    return (
        <div>
            {user ? (
                <Dashboard/>
            ) : (
                <LoginScreen />
            )}
        </div>
    );
};