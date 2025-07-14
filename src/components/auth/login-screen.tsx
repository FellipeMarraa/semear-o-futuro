"use client"

import type React from "react"
import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle, Lock, Mail} from "lucide-react"
import {useAuth} from "@/context/auth-context.tsx";

export default function LoginScreen() {
    const {signIn} = useAuth();
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await signIn(email, password)
        } catch (error: any) {
            setError(getErrorMessage(error.code))
        } finally {
            setLoading(false)
        }
    }

    const getErrorMessage = (errorCode: string) => {
        switch (errorCode) {
            case "auth/user-not-found":
                return "Usuário não encontrado. Verifique o e-mail digitado."
            case "auth/wrong-password":
                return "Senha incorreta. Tente novamente."
            case "auth/email-already-in-use":
                return "Este e-mail já está sendo usado por outra conta."
            case "auth/weak-password":
                return "A senha deve ter pelo menos 6 caracteres."
            case "auth/invalid-email":
                return "E-mail inválido. Verifique o formato digitado."
            default:
                return "Erro ao processar solicitação. Tente novamente."
        }
    }

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center">
            <div className=" p-6 w-full flex flex-col justify-center items-center">
                <Card className="shadow-xl sm:w-full md:-full lg:w-92 flex justify-center">
                    <CardHeader className="flex flex-col items-center justify-center">
                        <div className="w-full flex justify-center items-center">
                            <img src="/semear.png" className="h-32 w-32 text-blue-600" alt="Logo"/>
                        </div>
                        <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
                        <CardDescription className="text-center">Entre com suas credenciais para acessar o
                            sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4"/>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Entrando..." : "Entrar"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
