"use client";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { COUNTRIES, type Country } from "../countries";
import type { DateBounds, LocalDateTime } from "../time";

const ITEMS = COUNTRIES.map((c) => ({ value: c.code, label: c.nameKo }));

export function ObservationForm({
  country,
  local,
  bounds,
  onCountryChange,
  onLocalChange,
  onReset,
}: {
  country: Country;
  local: LocalDateTime;
  bounds: DateBounds;
  onCountryChange: (code: string) => void;
  onLocalChange: (local: LocalDateTime) => void;
  onReset: () => void;
}) {
  const selected = ITEMS.find((i) => i.value === country.code) ?? null;
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => e.preventDefault()}
      aria-label="관측 순간 입력"
    >
      <FieldGroup className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <Field>
          <FieldLabel htmlFor="country">국가</FieldLabel>
          <Combobox
            items={ITEMS}
            value={selected}
            onValueChange={(item) => item && onCountryChange(item.value)}
          >
            <ComboboxInput id="country" placeholder="나라 이름을 찾아보세요" />
            <ComboboxContent>
              <ComboboxEmpty>그런 나라는 없어요.</ComboboxEmpty>
              <ComboboxList>
                {(item: (typeof ITEMS)[number]) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
        <Field>
          <FieldLabel htmlFor="date">날짜</FieldLabel>
          <Input
            id="date"
            type="date"
            min={bounds.min}
            max={bounds.max}
            value={local.date}
            onChange={(e) => e.target.value && onLocalChange({ ...local, date: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="time">{country.nameKo} 현지 시각</FieldLabel>
          <Input
            id="time"
            type="time"
            value={local.time}
            onChange={(e) => e.target.value && onLocalChange({ ...local, time: e.target.value })}
          />
        </Field>
        <Button type="button" size="lg" onClick={onReset}>
          나의 오늘 밤 하늘
        </Button>
      </FieldGroup>
    </form>
  );
}
