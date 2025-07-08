import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Family, Donation } from "@/types"

// Coleções do Firestore
const FAMILIES_COLLECTION = "families"
const DONATIONS_COLLECTION = "donations"

// Funções para Famílias
export const addFamily = async (familyData: Omit<Family, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, FAMILIES_COLLECTION), {
      ...familyData,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Erro ao adicionar família:", error)
    throw error
  }
}

export const getFamilies = async (): Promise<Family[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, FAMILIES_COLLECTION), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastDonation: doc.data().lastDonation?.toDate(),
    })) as Family[]
  } catch (error) {
    console.error("Erro ao buscar famílias:", error)
    throw error
  }
}

export const updateFamily = async (familyId: string, updates: Partial<Family>) => {
  try {
    const familyRef = doc(db, FAMILIES_COLLECTION, familyId)
    await updateDoc(familyRef, updates)
  } catch (error) {
    console.error("Erro ao atualizar família:", error)
    throw error
  }
}

export const deleteFamily = async (familyId: string) => {
  try {
    await deleteDoc(doc(db, FAMILIES_COLLECTION, familyId))
  } catch (error) {
    console.error("Erro ao deletar família:", error)
    throw error
  }
}

// Funções para Doações
export const addDonation = async (donationData: Omit<Donation, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, DONATIONS_COLLECTION), {
      ...donationData,
      date: Timestamp.fromDate(donationData.date),
      createdAt: Timestamp.now(),
    })

    // Atualizar última doação da família
    await updateFamily(donationData.familyId, {
      lastDonation: donationData.date,
    })

    return docRef.id
  } catch (error) {
    console.error("Erro ao adicionar doação:", error)
    throw error
  }
}

export const getDonations = async (): Promise<Donation[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, DONATIONS_COLLECTION), orderBy("date", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Donation[]
  } catch (error) {
    console.error("Erro ao buscar doações:", error)
    throw error
  }
}

export const getDonationsByFamily = async (familyId: string): Promise<Donation[]> => {
  try {
    const q = query(collection(db, DONATIONS_COLLECTION), where("familyId", "==", familyId), orderBy("date", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Donation[]
  } catch (error) {
    console.error("Erro ao buscar doações da família:", error)
    throw error
  }
}

// Funções de busca e filtros
export const searchFamilies = async (searchTerm: string): Promise<Family[]> => {
  try {
    const families = await getFamilies()
    return families.filter(
      (family) =>
        family.responsibleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        family.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  } catch (error) {
    console.error("Erro ao buscar famílias:", error)
    throw error
  }
}

export const getFamiliesWithoutRecentDonations = async (days = 30): Promise<Family[]> => {
  try {
    const families = await getFamilies()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return families.filter((family) => !family.lastDonation || family.lastDonation < cutoffDate)
  } catch (error) {
    console.error("Erro ao buscar famílias sem doações recentes:", error)
    throw error
  }
}

// Listener em tempo real para famílias
export const subscribeFamilies = (callback: (families: Family[]) => void) => {
  const q = query(collection(db, FAMILIES_COLLECTION), orderBy("createdAt", "desc"))

  return onSnapshot(q, (querySnapshot) => {
    const families = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastDonation: doc.data().lastDonation?.toDate(),
    })) as Family[]

    callback(families)
  })
}

// Listener em tempo real para doações
export const subscribeDonations = (callback: (donations: Donation[]) => void) => {
  const q = query(collection(db, DONATIONS_COLLECTION), orderBy("date", "desc"))

  return onSnapshot(q, (querySnapshot) => {
    const donations = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Donation[]

    callback(donations)
  })
}
