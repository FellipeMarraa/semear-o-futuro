"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { subscribeFamilies, addDonation } from "@/lib/firestore.ts"
import type { Family } from "@/types"
import {useToast} from "@/components/ui/use-toast.ts";

interface DonationData {
  familyId: string
  familyName: string
  donationType: string
  quantity: string
  date: Date
  responsible: string
  observations: string
}

export default function DonationRegistration() {
  const { toast } = useToast()
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<DonationData>({
    familyId: "",
    familyName: "",
    donationType: "",
    quantity: "",
    date: new Date(),
    responsible: "",
    observations: "",
  })

  useEffect(() => {
    const unsubscribe = subscribeFamilies((familiesData) => {
      setFamilies(familiesData)
    })

    return () => unsubscribe()
  }, [])

  const donationTypes = [
    "Alimentos não perecíveis",
    "Alimentos perecíveis",
    "Roupas",
    "Calçados",
    "Produtos de higiene",
    "Produtos de limpeza",
    "Medicamentos",
    "Móveis",
    "Eletrodomésticos",
    "Material escolar",
    "Brinquedos",
    "Outros",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addDonation({
        familyId: formData.familyId,
        familyName: formData.familyName,
        donationType: formData.donationType,
        quantity: formData.quantity,
        date: formData.date,
        responsible: formData.responsible,
        observations: formData.observations,
      })

      toast({
        title: "Doação registrada com sucesso!",
        description: `Doação para ${formData.familyName} foi registrada.`,
      })

      // Reset form
      setFormData({
        familyId: "",
        familyName: "",
        donationType: "",
        quantity: "",
        date: new Date(),
        responsible: "",
        observations: "",
      })
    } catch (error) {
      toast({
        title: "Erro ao registrar doação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectFamily = (family: Family) => {
    setFormData((prev) => ({
      ...prev,
      familyId: family.id,
      familyName: family.responsibleName,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecionar Família</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Família Beneficiada *</Label>
            {formData.familyName ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <span className="font-medium">{formData.familyName}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, familyId: "", familyName: "" }))}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="grid gap-2">
                  {families.map((family) => (
                    <div
                      key={family.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectFamily(family)}
                    >
                      <div>
                        <span className="font-medium">{family.responsibleName}</span>
                        <span className="text-sm text-gray-500 ml-2">({family.neighborhood})</span>
                      </div>
                      <Button type="button" size="sm" variant="outline">
                        Selecionar
                      </Button>
                    </div>
                  ))}
                </div>
                {families.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Nenhuma família cadastrada ainda.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Doação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="donationType">Tipo da Doação *</Label>
              <Select
                value={formData.donationType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, donationType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de doação" />
                </SelectTrigger>
                <SelectContent>
                  {donationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade/Descrição *</Label>
              <Input
                id="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="Ex: 5kg, 10 unidades, 1 cesta básica"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Doação *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData((prev) => ({ ...prev, date: date || new Date() }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável pela Entrega *</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => setFormData((prev) => ({ ...prev, responsible: e.target.value }))}
                placeholder="Nome do responsável"
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
            <Label htmlFor="observations">Observações da Doação</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData((prev) => ({ ...prev, observations: e.target.value }))}
              placeholder="Ex: Família não estava em casa, doação recusada, necessidades específicas atendidas, etc."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="min-w-[150px]" disabled={!formData.familyId || loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Registrando..." : "Registrar Doação"}
        </Button>
      </div>
    </form>
  )
}
