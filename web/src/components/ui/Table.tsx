import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto border border-line bg-paper">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}

export function THead(props: ComponentProps<"thead">) {
  return <thead className="border-b border-line bg-sand" {...props} />;
}

export function TBody(props: ComponentProps<"tbody">) {
  return <tbody className="divide-y divide-line" {...props} />;
}

export function TR({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors duration-100", className)} {...props} />;
}

export function TH({ className, ...props }: ComponentProps<"th">) {
  return <th scope="col" className={cn("label px-4 py-3 font-medium whitespace-nowrap text-muted", className)} {...props} />;
}

export function TD({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
