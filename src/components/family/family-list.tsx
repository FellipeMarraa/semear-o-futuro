"use client"

import {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Calendar, Edit, Eye, Filter, MapPin, Phone, Search, Trash2, Users, X} from "lucide-react"
import {differenceInDays, format} from "date-fns"
import {ptBR} from "date-fns/locale"
import {deleteFamily, subscribeFamilies, updateFamily} from "@/lib/firestore.ts"
import type {Family} from "@/types"
import {cn} from "@/lib/utils.ts";
import {Separator} from "@/components/ui/separator.tsx";
import {useToast} from "@/components/ui/use-toast.ts";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"

export default function FamilyList() {
    const [families, setFamilies] = useState<Family[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [neighborhoodFilter, setNeighborhoodFilter] = useState("all")
    const [donationFilter, setDonationFilter] = useState("all")
    const [selectedFamily, setSelectedFamily] = useState<Family | undefined>(undefined)
    const [isFilterExpanded, setIsFilterExpanded] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editingFamily, setEditingFamily] = useState<Partial<Family>>({
        members: []
    })
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null)

    const {toast} = useToast()

    useEffect(() => {
        const unsubscribe = subscribeFamilies((familiesData) => {
            setFamilies(familiesData)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const neighborhoods = [...new Set(families.map((f) => f.neighborhood))]

    const filteredFamilies = families.filter((family) => {
        const matchesSearch =
            family.responsibleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            family.neighborhood.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesNeighborhood = neighborhoodFilter === "all" || family.neighborhood === neighborhoodFilter

        let matchesDonation: undefined | boolean = true
        if (donationFilter === "recent") {
            matchesDonation = family.lastDonation && differenceInDays(new Date(), family.lastDonation) <= 30
        } else if (donationFilter === "old") {
            matchesDonation = !family.lastDonation || differenceInDays(new Date(), family.lastDonation) > 30
        } else if (donationFilter === "never") {
            matchesDonation = !family.lastDonation
        }

        return matchesSearch && matchesNeighborhood && matchesDonation
    })

    const getDonationStatus = (family: Family) => {
        if (!family.lastDonation) {
            return {text: "Nunca recebeu", color: "bg-red-100 text-red-800"}
        }

        const daysSince = differenceInDays(new Date(), family.lastDonation)
        if (daysSince <= 30) {
            return {text: "Recente", color: "bg-green-100 text-green-800"}
        } else if (daysSince <= 60) {
            return {text: "Moderado", color: "bg-yellow-100 text-yellow-800"}
        } else {
            return {text: "Há muito tempo", color: "bg-red-100 text-red-800"}
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p>Carregando famílias...</p>
            </div>
        )
    }

    const handleDelete = async (family: Family) => {
        setFamilyToDelete(family)
        setOpenDeleteDialog(true)
    }

    const confirmDelete = async () => {
        if (!familyToDelete) return

        try {
            await deleteFamily(familyToDelete.id)
            toast({
                title: "Família excluída",
                description: "Registro removido com sucesso",
            })
        } catch (error) {
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir a família" + error,
                variant: "destructive",
            })
        } finally {
            setOpenDeleteDialog(false)
            setFamilyToDelete(null)
        }
    }

    const handleEdit = async () => {
        if (!editingFamily.id) return

        try {
            const updates = Object.entries(editingFamily).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    acc[key] = value
                }
                return acc
            }, {} as Partial<Family>)

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {id, ...updateData} = updates

            updateData.memberCount = updateData.members?.length || 0

            await updateFamily(editingFamily.id, updateData)
            setIsEditing(false)
            setSelectedFamily(undefined)
            toast({
                title: "Família atualizada",
                description: "Dados atualizados com sucesso",
            })
        } catch (error) {
            console.error("Erro ao atualizar:", error)
            toast({
                title: "Erro ao atualizar",
                description: "Não foi possível atualizar os dados",
                variant: "destructive",
            })
        }
    }

    const addMember = () => {
        setEditingFamily(prev => ({
            ...prev,
            members: [...(prev.members || []), {id: crypto.randomUUID(), age: 0}]
        }))
    }

    const removeMember = (memberId: string) => {
        setEditingFamily(prev => ({
            ...prev,
            members: prev.members?.filter(m => m.id !== memberId) || []
        }))
    }

    const updateMemberAge = (memberId: string, age: number) => {
        setEditingFamily(prev => ({
            ...prev,
            members: prev.members?.map(m =>
                m.id === memberId ? {...m, age} : m
            ) || []
        }))
    }

    return (
        <div className="space-y-4">
            {/* Filtros em Card Colapsável em Mobile */}
            <Card>
                <CardHeader className="cursor-pointer select-none"
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
                    <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5"/>
                            <span className="text-base sm:text-lg">Filtros de Busca</span>
                        </div>
                        <Button variant="ghost" size="sm" className="md:hidden">
                            {isFilterExpanded ? <X className="h-4 w-4"/> : <Filter className="h-4 w-4"/>}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className={cn(
                    "space-y-4 transition-all",
                    isFilterExpanded ? "block" : "hidden md:block"
                )}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search" className="text-sm">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                                <Input
                                    id="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Nome ou Bairro..."
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Bairro</Label>
                            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todos os bairros"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os bairros</SelectItem>
                                    {neighborhoods.map((n) => (
                                        <SelectItem key={n} value={n}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Status Doação</Label>
                            <Select value={donationFilter} onValueChange={setDonationFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todas"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="recent">Últimos 30 dias</SelectItem>
                                    <SelectItem value="old">+ 30 dias sem doação</SelectItem>
                                    <SelectItem value="never">Nunca receberam</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Famílias */}
            <div className="space-y-4 h-[calc(100vh-280px)] flex flex-col">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-base sm:text-lg font-semibold">
                        Famílias Encontradas ({filteredFamilies.length})
                    </h3>
                </div>

                <div className="grid gap-4 overflow-y-auto max-h-full pr-2">
                    {filteredFamilies.map((family) => {
                        const status = getDonationStatus(family)
                        return (
                            <Card key={family.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                <h4 className="text-base sm:text-lg font-semibold">{family.responsibleName}</h4>
                                                <Badge className={`${status.color} w-fit`}>{status.text}</Badge>
                                            </div>

                                            <div
                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-400"/>
                                                    <span>{family.memberCount} membros</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400"/>
                                                    <span>{family.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-400"/>
                                                    <span>{family.neighborhood}</span>
                                                </div>
                                            </div>

                                            {family.lastDonation && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="h-4 w-4"/>
                                                    <span>Última: {format(family.lastDonation, "dd/MM/yyyy", {locale: ptBR})}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedFamily(family)
                                                    setEditingFamily({})
                                                    setIsEditing(false)
                                                }}
                                                className="w-full sm:w-auto"
                                            >
                                                <Eye className="h-4 w-4 sm:mr-2"/>
                                                <span className="hidden sm:inline">Ver</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const {
                                                        id,
                                                        responsibleName,
                                                        phone,
                                                        address,
                                                        complemento,
                                                        number,
                                                        neighborhood,
                                                        observations,
                                                        members,
                                                        memberCount
                                                    } = family

                                                    setEditingFamily({
                                                        id,
                                                        responsibleName,
                                                        phone,
                                                        address,
                                                        complemento,
                                                        number,
                                                        neighborhood,
                                                        observations,
                                                        members: [...(members || [])],
                                                        memberCount
                                                    })
                                                    setSelectedFamily(family)
                                                    setIsEditing(true)
                                                }}
                                                className="w-full sm:w-auto"
                                            >
                                                <Edit className="h-4 w-4 sm:mr-2"/>
                                                <span className="hidden sm:inline">Editar</span>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(family)}
                                                className="w-full sm:w-auto"
                                            >
                                                <Trash2 className="h-4 w-4 sm:mr-2"/>
                                                <span className="hidden sm:inline">Excluir</span>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}

                    {filteredFamilies.length === 0 && (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p className="text-gray-500">Nenhuma família encontrada.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Modal Responsivo */}
            {selectedFamily && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
                    <Card className="w-full max-w-2xl h-[90vh] flex flex-col">
                        <CardHeader className="sticky top-0 bg-white z-10 border-b">
                            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                                {isEditing ? "Editar Família" : "Detalhes da Família"}
                                <div className="flex gap-2">
                                    {!isEditing && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingFamily(selectedFamily)
                                                setIsEditing(true)
                                            }}
                                        >
                                            <Edit className="h-4 w-4 mr-2"/>
                                            Editar
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedFamily(undefined)
                                            setIsEditing(false)
                                        }}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nome do Responsável</Label>
                                            <Input
                                                value={editingFamily?.responsibleName}
                                                onChange={(e) =>
                                                    setEditingFamily({
                                                        ...editingFamily,
                                                        responsibleName: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Telefone</Label>
                                            <Input
                                                value={editingFamily.phone}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '')
                                                    const formattedValue = value
                                                        .replace(/^(\d{2})(\d)/g, '($1) $2')
                                                        .replace(/(\d{5})(\d)/, '$1-$2')
                                                        .slice(0, 15)
                                                    setEditingFamily({
                                                        ...editingFamily,
                                                        phone: formattedValue,
                                                    })
                                                }}
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Endereço</Label>
                                            <Input
                                                value={editingFamily.address}
                                                onChange={(e) =>
                                                    setEditingFamily({
                                                        ...editingFamily,
                                                        address: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Bairro</Label>
                                            <Input
                                                value={editingFamily.neighborhood}
                                                onChange={(e) =>
                                                    setEditingFamily({
                                                        ...editingFamily,
                                                        neighborhood: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Membros da Família</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addMember}
                                            >
                                                Adicionar Membro
                                            </Button>
                                        </div>

                                        <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2">
                                            {editingFamily.members?.map((member, index) => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-md"
                                                >
                                                    <span className="text-sm text-gray-500">
                                                        Membro {index + 1}
                                                    </span>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={member.age}
                                                                onChange={(e) => updateMemberAge(
                                                                    member.id,
                                                                    parseInt(e.target.value) || 0
                                                                )}
                                                                className="w-24"
                                                                placeholder="Idade"
                                                            />
                                                            <span className="text-sm">anos</span>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeMember(member.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            ))}

                                            {(!editingFamily.members || editingFamily.members.length === 0) && (
                                                <p className="text-sm text-gray-500 text-center py-2">
                                                    Nenhum membro adicionado
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Observações</Label>
                                        <Input
                                            value={editingFamily.observations}
                                            onChange={(e) =>
                                                setEditingFamily({
                                                    ...editingFamily,
                                                    observations: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsEditing(false)
                                                setEditingFamily({})
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button onClick={handleEdit}>Salvar</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h4 className="font-semibold text-lg">{selectedFamily?.responsibleName}</h4>
                                        {selectedFamily.members?.length > 0 && (
                                            <p className="text-gray-600">{selectedFamily?.memberCount} membros</p>
                                        )}
                                    </div>

                                    <Separator/>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="font-medium mb-2">Contato</h5>
                                            <p className="text-sm">Telefone: {selectedFamily?.phone}</p>
                                            {selectedFamily?.email &&
                                                <p className="text-sm">E-mail: {selectedFamily?.email}</p>}
                                        </div>
                                        <div>
                                            <h5 className="font-medium mb-2">Endereço</h5>
                                            <p className="text-sm">{selectedFamily?.address}, {selectedFamily?.number}</p>
                                            <p className="text-sm">
                                                {selectedFamily?.neighborhood}, {selectedFamily?.city}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator/>

                                    {selectedFamily.members?.length > 0 && (
                                        <>
                                            <div>
                                                <h5 className="font-medium mb-2">Membros da Família</h5>
                                                <div
                                                    className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2">
                                                    {selectedFamily?.members.map((member, index) => (
                                                        <div key={member.id} className="text-sm p-2 bg-gray-50 rounded">
                                                            Membro {index + 1}: {member.age} anos
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator/>
                                        </>
                                    )}

                                    <div>
                                        <h5 className="font-medium mb-2">Histórico</h5>
                                        {selectedFamily?.lastDonation ? (
                                            <p className="text-sm">
                                                Última
                                                doação: {format(selectedFamily?.lastDonation, "dd/MM/yyyy", {locale: ptBR})}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-red-600">Nunca recebeu doação</p>
                                        )}
                                    </div>

                                    {selectedFamily?.observations && (
                                        <>
                                            <Separator/>
                                            <div>
                                                <h5 className="font-medium mb-2">Observações</h5>
                                                <p className="text-sm">{selectedFamily?.observations}</p>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja realmente excluir a família de {familyToDelete?.responsibleName}?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenDeleteDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Excluir
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}