"use client"

import {useState} from "react"
import {signOut} from "firebase/auth"
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {BarChart3, Gift, LogOut, Menu, Search, Users, X} from "lucide-react"
import {useToast} from "@/components/ui/use-toast.ts"
import {auth} from "@/lib/firebase.ts"
import FamilyRegistration from "@/components/family/family-registration.tsx"
import DonationRegistration from "@/components/donation/donation-registration.tsx"
import FamilyList from "@/components/family/family-list.tsx"
import ReportsPanel from "@/components/reports/reports-panel.tsx"
import {cn} from "@/lib/utils"

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("families")
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { toast } = useToast()

    const handleLogout = async () => {
        try {
            await signOut(auth)
            toast({
                title: "Logout realizado com sucesso!",
                description: "Até logo!",
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast({
                title: "Erro ao fazer logout",
                description: "Tente novamente.",
                variant: "destructive",
            })
        }
    }

    const tabs = [
        { id: "families", label: "Famílias", icon: Users },
        { id: "donations", label: "Doações", icon: Gift },
        { id: "search", label: "Buscar", icon: Search },
        { id: "reports", label: "Relatórios", icon: BarChart3 },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-50 max-h-20">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 h-20">
                    <div className="flex justify-between h-full p-6">
                        <div className="flex items-center justify-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden mr-2"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                            <img src="public/semear.png" className="w-20 text-blue-600 mr-3 hidden sm:block"  alt="Logo"/>
                            <div>
                                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Sistema de Controle</h1>
                                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Gerenciamento de cadastros</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Sair</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Menu Lateral Mobile */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity",
                    isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <div
                className={cn(
                    "fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 bg-white z-40 transform transition-transform md:hidden",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-center mt-5 mb-0">
                    <img src="public/semear.png" className="w-20 text-blue-600 mr-3"  alt="Logo"/>
                </div>
                <div className="p-4 mt-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id)
                                setIsMobileMenuOpen(false)
                            }}
                            className={cn(
                                "w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium",
                                activeTab === tab.id
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            <tab.icon className="h-5 w-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conteúdo Principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="md:block hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4">
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="flex items-center gap-2"
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                <div className="space-y-6 mt-6">
                    {activeTab === "families" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Cadastro de Famílias</CardTitle>
                                <CardDescription>Registre novas famílias no sistema</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FamilyRegistration />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "donations" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Registro de Doações</CardTitle>
                                <CardDescription>Registre doações realizadas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DonationRegistration />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "search" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Buscar Famílias</CardTitle>
                                <CardDescription>Encontre famílias cadastradas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FamilyList />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "reports" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Painel de Relatórios</CardTitle>
                                <CardDescription>Visualize estatísticas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ReportsPanel />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    )
}