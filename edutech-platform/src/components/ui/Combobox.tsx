"use client";

import { useId, useMemo, useState } from "react";

import { Input, Label } from "@/components/ui/Field";

export function Combobox({
  name,
  label,
  options,
  placeholder = "Tìm và chọn",
  required,
}: {
  name: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
}) {
  const id = useId();
  const listId = `${id}-options`;
  const optionByLabel = useMemo(() => new Map(options.map((option) => [option.label, option.value])), [options]);
  const [selectedValue, setSelectedValue] = useState("");

  return (
    <div>
      <Label htmlFor={id} required={required}>{label}</Label>
      <Input
        id={id}
        list={listId}
        placeholder={placeholder}
        required={required}
        role="combobox"
        aria-autocomplete="list"
        onChange={(event) => setSelectedValue(optionByLabel.get(event.currentTarget.value) ?? "")}
      />
      <input type="hidden" name={name} value={selectedValue} />
      <datalist id={listId}>
        {options.map((option) => <option key={option.value} value={option.label} />)}
      </datalist>
    </div>
  );
}
