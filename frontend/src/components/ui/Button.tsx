import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const cls = { primary: "btn-primary", secondary: "btn-secondary", ghost: "btn-ghost" }[variant];
  return <button className={`${cls} ${className}`} {...props} />;
}
