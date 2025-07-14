"use client"

import type React from "react"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Plus, Minus, Save} from "lucide-react"
import {addFamily} from "../../lib/firestore"
import type {FamilyMember} from "../../types"
import {useToast} from "@/components/ui/use-toast.ts";

interface FamilyData {
    responsibleName: string
    memberCount: number
    members: FamilyMember[]
    phone: string
    email: string
    cep: string
    address: string
    neighborhood: string
    complemento: string
    number: string
    city: string
    state: string
    observations: string
}

export default function FamilyRegistration() {
    const {toast} = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<FamilyData>({
        responsibleName: "",
        memberCount: 0,
        members: [],
        phone: "",
        email: "",
        cep: "",
        address: "",
        neighborhood: "",
        complemento: "",
        number: "",
        city: "",
        state: "",
        observations: "",
    });

    const addMember = () => {
        const newMember = {
            id: Date.now().toString(),
            age: 0,
        }
        setFormData((prev) => ({
            ...prev,
            memberCount: prev.memberCount + 1,
            members: [...prev.members, newMember],
        }))
    }

    const removeMember = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            memberCount: prev.memberCount - 1,
            members: prev.members.filter((member) => member.id !== id),
        }))
    }

    const updateMemberAge = (id: string, age: number) => {
        setFormData((prev) => ({
            ...prev,
            members: prev.members.map((member) => (member.id === id ? {...member, age} : member)),
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await addFamily({
                responsibleName: formData.responsibleName,
                memberCount: formData.memberCount,
                members: formData.members,
                phone: formData.phone,
                email: formData.email,
                cep: formData.cep,
                address: formData.address,
                complemento: formData.complemento,
                number: formData.number,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
                observations: formData.observations,
            })

            toast({
                title: "Família cadastrada com sucesso!",
                description: `${formData.responsibleName} foi adicionado ao sistema.`,
            })

            // Reset form
            setFormData({
                responsibleName: "",
                memberCount: 1,
                members: [],
                phone: "",
                email: "",
                cep: "",
                address: "",
                neighborhood: "",
                complemento: "",
                number: "",
                city: "",
                state: "",
                observations: "",
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast({
                title: "Erro ao cadastrar família",
                description: "Tente novamente mais tarde.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '')
        value = value.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
        setFormData(prev => ({...prev, cep: value}))

        if (value.length === 9) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${value.replace('-', '')}/json/`)
                const data = await response.json()

                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf
                    }))
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error)
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Dados do Responsável</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="responsibleName">Nome do Responsável *</Label>
                            <Input
                                id="responsibleName"
                                value={formData.responsibleName}
                                onChange={(e) => setFormData((prev) => ({...prev, responsibleName: e.target.value}))}
                                placeholder="Nome completo do responsável"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone *</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '')
                                    const formattedValue = value
                                        .replace(/^(\d{2})(\d)/g, '($1) $2')
                                        .replace(/(\d{5})(\d)/, '$1-$2')
                                        .slice(0, 15)
                                    setFormData((prev) => ({...prev, phone: formattedValue}))
                                }}
                                placeholder="(00) 00000-0000"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({...prev, email: e.target.value}))}
                            placeholder="email@exemplo.com"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Membros da Família</CardTitle>
                    <p className="text-sm text-gray-400">Adicione outros membros da família</p>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[25vh] overflow-auto">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total de membros: {formData.memberCount}</span>
                        <Button type="button" onClick={addMember} size="sm" variant="outline">
                            <Plus className="h-4 w-4"/>
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {formData.members.map((member, index) => (
                            <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                <span className="text-sm font-medium min-w-[80px]">Membro {index + 1}:</span>
                                <div className="flex-1">
                                    <Input
                                        value={member.age || ""}
                                        onChange={(e) => updateMemberAge(member.id, Number.parseInt(e.target.value) || 0)}
                                        placeholder="Idade"
                                        type="number"
                                        min="0"
                                        max="120"
                                    />
                                </div>
                                <Button type="button" onClick={() => removeMember(member.id)} size="sm"
                                        variant="outline">
                                    <Minus className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    <div className="space-y-2 w-28">
                        <Label htmlFor="cep">CEP *</Label>
                        <Input
                            id="cep"
                            value={formData.cep}
                            onChange={handleCepChange}
                            placeholder="00000-000"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div className="space-y-2">
                            <Label htmlFor="address">Endereço *</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData((prev) => ({...prev, address: e.target.value}))}
                                placeholder="Rua, Avenida, etc."
                                disabled={true}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="number">Número *</Label>
                            <Input
                                id="number"
                                value={formData.number}
                                onChange={(e) => setFormData((prev) => ({...prev, number: e.target.value}))}
                                placeholder="Número da residência"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="complemento">Complemento</Label>
                            <Input
                                id="complemento"
                                value={formData.complemento}
                                onChange={(e) => setFormData((prev) => ({...prev, complemento: e.target.value}))}
                                placeholder="Complemento"
                            />
                        </div>

                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div className="space-y-2">
                            <Label htmlFor="neighborhood">Bairro *</Label>
                            <Input
                                id="neighborhood"
                                value={formData.neighborhood}
                                onChange={(e) => setFormData((prev) => ({...prev, neighborhood: e.target.value}))}
                                placeholder="Nome do bairro"
                                disabled={true}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">Cidade *</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData((prev) => ({...prev, city: e.target.value}))}
                                placeholder="Nome da cidade"
                                disabled={true}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">Estado *</Label>
                            <Input
                                id="state"
                                value={formData.state}
                                onChange={(e) => setFormData((prev) => ({...prev, state: e.target.value}))}
                                placeholder="UF"
                                disabled={true}
                                required
                            />
                        </div>

                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="observations">Observações Gerais</Label>
                        <Textarea
                            id="observations"
                            value={formData.observations}
                            onChange={(e) => setFormData((prev) => ({...prev, observations: e.target.value}))}
                            placeholder="Condições da moradia, necessidades específicas, etc."
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" size="lg" className="min-w-[150px]" disabled={loading}>
                    <Save className="h-4 w-4 mr-2"/>
                    {loading ? "Cadastrando..." : "Cadastrar Família"}
                </Button>
            </div>
        </form>
    )
}
