"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, MoneyInput } from "@/components/ui/Field";
import { CloseIcon, PlusIcon } from "@/components/ui/icons";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { OPTION_SUGGESTIONS, syncVariants, variantLabel, type OptionDraft, type VariantDraft } from "./product-form-utils";

/** Type a choice and press Enter or comma to add it. */
function ChoicesInput({ values, onChange, label }: { values: string[]; onChange: (values: string[]) => void; label: string }) {
  const [text, setText] = useState("");
  const id = useId();

  function commit() {
    const parts = text
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v && !values.includes(v));
    if (parts.length) onChange([...values, ...parts]);
    setText("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !text && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 border border-line-strong bg-paper p-1.5 focus-within:border-ink">
        {values.map((v) => (
          <span key={v} className="inline-flex h-8 items-center gap-1 border border-line bg-sand pl-2.5 text-sm">
            {v}
            <button
              type="button"
              className="flex h-full items-center px-1.5 hover:text-danger"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
            >
              <CloseIcon className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder={values.length ? "Add another" : "For example S, M, L"}
          className="h-8 min-w-32 flex-1 bg-transparent px-1.5 text-[15px] focus:outline-none"
        />
      </div>
      <p className="text-xs text-muted">Press Enter after each one.</p>
    </div>
  );
}

interface Props {
  options: OptionDraft[];
  variants: VariantDraft[];
  basePriceCents: number | null;
  onChange: (options: OptionDraft[], variants: VariantDraft[]) => void;
  errors: Record<string, string>;
}

export function VariantsEditor({ options, variants, basePriceCents, onChange, errors }: Props) {
  const setOptions = (next: OptionDraft[]) => onChange(next, syncVariants(next, variants));
  const renameOption = (index: number, name: string) => {
    const old = options[index]?.name ?? "";
    const next = options.map((o, i) => (i === index ? { ...o, name } : o));
    const renamed = variants.map((v) => {
      if (!(old in v.options)) return v;
      const { [old]: value, ...rest } = v.options;
      return { ...v, options: { ...rest, [name]: value ?? "" } };
    });
    onChange(next, syncVariants(next, renamed));
  };
  const setVariant = (index: number, patch: Partial<VariantDraft>) =>
    onChange(options, variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const unusedSuggestion = OPTION_SUGGESTIONS.find((s) => !options.some((o) => o.name.toLowerCase() === s.toLowerCase()));
  const hasOptions = options.length > 0;
  const variantErrors = Object.entries(errors).filter(([k]) => k.startsWith("variants"));

  if (!hasOptions) {
    const only = variants[0] ?? { options: {}, sku: "", priceCents: null, stock: 0 };
    return (
      <div className="flex flex-col gap-5">
        <Field label="How many do you have?" error={errors["variants.0.stock"]} className="max-w-48">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={only.stock ?? ""}
            onChange={(e) => setVariant(0, { stock: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </Field>
        <div>
          <Button variant="secondary" size="sm" onClick={() => setOptions([{ name: "Size", values: [] }])}>
            <PlusIcon className="size-4" /> Add sizes or colours
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {options.map((option, index) => (
        <div key={index} className="grid gap-4 border border-line p-4 sm:grid-cols-[200px_1fr_auto] sm:items-start">
          <Field label="Option name" error={errors.options}>
            <Input
              value={option.name}
              list="option-suggestions"
              onChange={(e) => renameOption(index, e.target.value)}
            />
          </Field>
          <ChoicesInput
            label="Choices"
            values={option.values}
            onChange={(values) => setOptions(options.map((o, i) => (i === index ? { ...o, values } : o)))}
          />
          <button
            type="button"
            className="self-start text-sm text-danger underline underline-offset-4 sm:mt-8"
            onClick={() => setOptions(options.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <datalist id="option-suggestions">
        {OPTION_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {options.length < 3 && (
        <div>
          <Button variant="secondary" size="sm" onClick={() => setOptions([...options, { name: unusedSuggestion ?? "", values: [] }])}>
            <PlusIcon className="size-4" /> Add another option
          </Button>
        </div>
      )}

      {variants.some((v) => Object.keys(v.options).length > 0) && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Set the stock for each one. Leave the price empty to use the main price.</p>
          <Table>
            <THead>
              <tr>
                <TH>{options.map((o) => o.name || "Option").join(" / ")}</TH>
                <TH className="w-40">Price</TH>
                <TH className="w-32">In stock</TH>
              </tr>
            </THead>
            <TBody>
              {variants.map((v, i) => (
                <TR key={variantLabel(options, v.options)}>
                  <TD className="font-medium">{variantLabel(options, v.options)}</TD>
                  <TD>
                    <MoneyInput
                      aria-label={`Price for ${variantLabel(options, v.options)}`}
                      value={v.priceCents}
                      placeholder={basePriceCents != null ? (basePriceCents / 100).toString() : ""}
                      onChange={(priceCents) => setVariant(i, { priceCents })}
                      invalid={Boolean(errors[`variants.${i}.priceCents`])}
                    />
                  </TD>
                  <TD>
                    <Input
                      aria-label={`Stock for ${variantLabel(options, v.options)}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={v.stock ?? ""}
                      onChange={(e) => setVariant(i, { stock: e.target.value === "" ? null : Number(e.target.value) })}
                      invalid={Boolean(errors[`variants.${i}.stock`] || errors[`variants.${i}`])}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
      {variantErrors.length > 0 && (
        <p role="alert" className="text-sm text-danger">
          {variantErrors[0]![1]}
        </p>
      )}
    </div>
  );
}

/** Stock codes per row, shown under Advanced. */
export function StockCodesEditor({
  options,
  variants,
  onChange,
}: {
  options: OptionDraft[];
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Optional codes for your own records (SKU). Each code must be different.</p>
      {variants.map((v, i) => (
        <Field key={i} label={options.length ? `Stock code for ${variantLabel(options, v.options)}` : "Stock code"} className="max-w-sm">
          <Input value={v.sku} onChange={(e) => onChange(variants.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} />
        </Field>
      ))}
    </div>
  );
}
