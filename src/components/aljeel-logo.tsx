export function AljeelLogo({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "light";
  className?: string;
}) {
  const src =
    variant === "light" ? "/aljeel-logo-white.png" : "/aljeel-logo-transparent.png";

  return (
    <img
      src={src}
      alt="Aljeel"
      className={`w-auto overflow-visible object-contain object-left ${
        variant === "light" ? "h-14" : "mx-auto h-14"
      } ${className}`}
    />
  );
}
