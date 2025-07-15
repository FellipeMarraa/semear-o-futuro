"use client"

import {useEffect, useState} from "react"
import {getDonationsByFamily, getFamilies} from "@/lib/firestore"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Calendar, Check, ChevronsUpDown, Package, Search, Users} from "lucide-react"
import {useToast} from "@/components/ui/use-toast"
import type {Donation, Family} from "@/types"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {cn} from "@/lib/utils.ts";

export default function DonationHistory() {
    const [families, setFamilies] = useState<Family[]>([])
    const [, setSelectedFamilyId] = useState<string>("")
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null)
    const [donations, setDonations] = useState<Donation[]>([])
    const [loading, setLoading] = useState(false)
    const {toast} = useToast();
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

    useEffect(() => {
        const loadFamilies = async () => {
            try {
                const familiesData = await getFamilies()
                setFamilies(familiesData)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                toast({
                    title: "Erro ao carregar famílias",
                    description: "Não foi possível carregar a lista de famílias.",
                    variant: "destructive",
                })
            }
        }
        loadFamilies()
    }, [toast])

    const handleFamilySelect = async (familyId: string) => {
        setSelectedFamilyId(familyId)
        const family = families.find((f) => f.id === familyId) || null
        setSelectedFamily(family)

        if (!familyId) {
            setDonations([])
            return
        }

        setLoading(true)
        try {
            const donationsData = await getDonationsByFamily(familyId)
            setDonations(donationsData)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast({
                title: "Erro ao carregar doações",
                description: "Não foi possível carregar o histórico de doações.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // Formatar data para exibição
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(date)
    }

    // Limpar seleção
    const clearSelection = () => {
        setSelectedFamilyId("")
        setSelectedFamily(null)
        setDonations([])
    }

    return (
        <div className="space-y-6">
            {/* Seleção de Família */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5"/>
                        Selecionar Família
                    </CardTitle>
                    <CardDescription>Escolha uma família para visualizar seu histórico de doações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <div className=" flex-1 py-1 space-y-2">
                            <Label htmlFor="family-select">Família</Label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full max-w-96 justify-between"
                                    >
                                        <span className="truncate max-w-[85%] text-left">
                                          {value
                                              ? (() => {
                                                  const family = families.find((f) => f.id === value)
                                                  return family
                                                      ? `${family.responsibleName} (${family.neighborhood})`
                                                      : "Selecione uma família"
                                              })()
                                              : "Selecione uma família"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-full p-0">
                                    <Command
                                        filter={(value, search) => {
                                            const family = families.find((f) => f.id === value)
                                            if (!family) return 0
                                            const text = `${family.responsibleName} ${family.neighborhood}`.toLowerCase()
                                            return text.includes(search.toLowerCase()) ? 1 : 0
                                        }}
                                    >
                                        <CommandInput placeholder="Buscar por nome ou bairro..." className="h-9"/>
                                        <CommandList>
                                            <CommandEmpty>Nenhuma família encontrada.</CommandEmpty>
                                            <CommandGroup>
                                                {families.map((family) => (
                                                    <CommandItem
                                                        key={family.id}
                                                        value={family.id}
                                                        onSelect={(currentValue) => {
                                                            setValue(currentValue)
                                                            setOpen(false)
                                                            handleFamilySelect(currentValue)
                                                        }}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span
                                                                className="font-medium">{family.responsibleName}</span>
                                                            <span className="text-sm text-muted-foreground">
                                                              {family.neighborhood} • {family.memberCount} membros
                                                            </span>
                                                        </div>
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4",
                                                                value === family.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {selectedFamily && (
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground"/>
                                <div>
                                    <p className="font-medium">{selectedFamily.responsibleName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedFamily.neighborhood} • {selectedFamily.memberCount} membros
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={clearSelection}>
                                Limpar
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Histórico de Doações */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5"/>
                        Histórico de Doações
                    </CardTitle>
                    <CardDescription>Histórico completo de doações
                        para {selectedFamily?.responsibleName}</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2">Carregando histórico...</span>
                        </div>
                    ) : donations.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                            <p className="text-muted-foreground">Nenhuma doação encontrada para esta família.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3"/>
                                    {donations.length} doação(ões) registrada(s)
                                </Badge>
                                {selectedFamily?.lastDonation &&
                                    <span>Última doação: {formatDate(selectedFamily?.lastDonation)}</span>}
                            </div>

                            <div className="rounded-md border h-full max-h-80 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Quantidade</TableHead>
                                            <TableHead>Observação</TableHead>
                                            <TableHead>Responsável pela Entrega</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {donations.map((donation) => (
                                            <TableRow key={donation.id}>
                                                <TableCell
                                                    className="font-medium">{formatDate(donation.date)}
                                                </TableCell>
                                                <TableCell>
                                                    {donation.quantity || (
                                                        <span
                                                            className="text-muted-foreground italic">Sem quantidade</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {donation.observations || (
                                                        <span
                                                            className="text-muted-foreground italic">Sem observação</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{donation.responsible}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}