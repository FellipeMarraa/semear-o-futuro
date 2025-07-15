"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {Users, Gift, AlertTriangle, Calendar, Package, Trash} from "lucide-react"
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { subscribeFamilies, subscribeDonations, recalculateLastDonationForFamily } from "@/lib/firestore.ts"
import type { Family, Donation } from "@/types"
import {deleteDoc, doc} from "firebase/firestore";
import {db} from "@/lib/firebase.ts";
import {Button} from "@/components/ui/button.tsx";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";

export default function ReportsPanel() {
  const [families, setFamilies] = useState<Family[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [donationToDelete, setDonationToDelete] = useState<Donation | null>(null)

  const confirmDelete = async () => {
    if (!donationToDelete) return

    try {
      await deleteDoc(doc(db, "donations", donationToDelete.id))

      setDonations((prev) => prev.filter((d) => d.id !== donationToDelete.id))

      await recalculateLastDonationForFamily(donationToDelete.familyId)

      setOpenDeleteDialog(false)
      setDonationToDelete(null)
    } catch (error) {
      console.error("Erro ao deletar doação:", error)
    }
  }


  useEffect(() => {
    const unsubscribeFamilies = subscribeFamilies((familiesData) => {
      setFamilies(familiesData)
      setLoading(false)
    })

    const unsubscribeDonations = subscribeDonations((donationsData) => {
      setDonations(donationsData)
    })

    return () => {
      unsubscribeFamilies()
      unsubscribeDonations()
    }
  }, [])

  // Cálculos dos dados
  const totalFamilies = families.length
  const currentMonth = new Date()
  const startMonth = startOfMonth(currentMonth)
  const endMonth = endOfMonth(currentMonth)

  const donationsThisMonth = donations.filter((donation) => donation.date >= startMonth && donation.date <= endMonth)

  const familiesWithRecentDonations = families.filter(
    (family) => family.lastDonation && differenceInDays(new Date(), family.lastDonation) <= 30,
  ).length

  const familiesWithoutDonations = families.filter(
    (family) => !family.lastDonation || differenceInDays(new Date(), family.lastDonation) > 30,
  ).length

  // Doações por tipo
  const donationsByType = donations.reduce(
    (acc, donation) => {
      acc[donation.donationType] = (acc[donation.donationType] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const donationTypeStats = Object.entries(donationsByType)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / donations.length) * 100) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Doações recentes
  const recentDonations = donations.slice(0, 5)

  // Famílias que precisam de atenção
  const familiesNeedingAttention = families
    .filter((family) => !family.lastDonation || differenceInDays(new Date(), family.lastDonation) > 30)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Carregando relatórios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Famílias</p>
                <p className="text-3xl font-bold text-blue-600">{totalFamilies}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doações Este Mês</p>
                <p className="text-3xl font-bold text-green-600">{donationsThisMonth.length}</p>
              </div>
              <Gift className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Com Doação Recente</p>
                <p className="text-3xl font-bold text-purple-600">{familiesWithRecentDonations}</p>
                <p className="text-xs text-gray-500">Últimos 30 dias</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precisam de Atenção</p>
                <p className="text-3xl font-bold text-red-600">{familiesWithoutDonations}</p>
                <p className="text-xs text-gray-500">Sem doação há 30+ dias</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Doações por Tipo */}
      {donationTypeStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Doações por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {donationTypeStats.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.type}</span>
                    <span className="text-gray-600">
                      {item.count} doações ({item.percentage}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Doações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDonations.length > 0 ? (
                recentDonations.map((donation, index) => (
                  <div key={index} className="flex h-full items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{donation.familyName}</p>
                      <p className="text-sm text-gray-600">{donation.donationType}</p>
                      <p className="text-xs text-gray-500">Por: {donation.responsible}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{format(donation.date, "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setDonationToDelete(donation)
                          setOpenDeleteDialog(true)
                        }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhuma doação registrada ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Famílias que Precisam de Atenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Famílias que Precisam de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {familiesNeedingAttention.length > 0 ? (
                familiesNeedingAttention.map((family, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{family.responsibleName}</p>
                      <p className="text-xs text-gray-500">
                        {family.lastDonation
                          ? `Última doação: ${format(family.lastDonation, "dd/MM/yyyy", { locale: ptBR })}`
                          : "Nunca recebeu doação"}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {family.lastDonation ? `${differenceInDays(new Date(), family.lastDonation)} dias` : "Nunca"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Todas as famílias estão em dia!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{totalFamilies}</p>
              <p className="text-sm text-gray-600">Famílias Cadastradas</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">{donations.length}</p>
              <p className="text-sm text-gray-600">Total de Doações</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {totalFamilies > 0 ? Math.round((familiesWithRecentDonations / totalFamilies) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">Taxa de Atendimento</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir a doação feita por {donationToDelete?.responsible} para a família {donationToDelete?.familyName}? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>


  )
}
