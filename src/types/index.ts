export interface Family {
  id: string
  responsibleName: string
  memberCount: number
  members: FamilyMember[]
  phone: string
  email?: string
  cep: string
  address: string
  neighborhood: string
  city: string
  state: string
  observations?: string
  createdAt: Date
  lastDonation?: Date
}

export interface FamilyMember {
  id: string
  age: number
}

export interface Donation {
  id: string
  familyId: string
  familyName: string
  donationType: string
  quantity: string
  date: Date
  responsible: string
  observations?: string
  createdAt: Date
}

export interface DonationType {
  id: string
  name: string
  category:
    | "food"
    | "clothing"
    | "hygiene"
    | "cleaning"
    | "medicine"
    | "furniture"
    | "electronics"
    | "school"
    | "toys"
    | "other"
}
