"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

import type { Family } from "@/types"

interface FamilyComboboxProps {
    families: Family[]
    selectedFamilyId: string | null
    onSelect: (familyId: string) => void
}

export function FamilyCombobox({ families, selectedFamilyId, onSelect }: FamilyComboboxProps) {
    const [open, setOpen] = React.useState(false)

    const selectedFamily = families.find(f => f.id === selectedFamilyId)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full max-w-96 justify-between"
                >
                    {selectedFamily
                        ? `${selectedFamily.responsibleName} (${selectedFamily.neighborhood})`
                        : "Selecione uma família"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full max-w-96 p-0">
                <Command>
                    <CommandInput placeholder="Buscar por nome ou bairro..." />
                    <CommandList>
                        <CommandEmpty>Nenhuma família encontrada.</CommandEmpty>
                        <CommandGroup>
                            {families.map((family) => (
                                <CommandItem
                                    key={family.id}
                                    value={family.id}
                                    onSelect={() => {
                                        onSelect(family.id)
                                        setOpen(false)
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{family.responsibleName}</span>
                                        <span className="text-sm text-muted-foreground">
                      {family.neighborhood} • {family.memberCount} membros
                    </span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            selectedFamilyId === family.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}