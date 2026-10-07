import { ReactNode } from "react";

export default function Container({
  children,
  className = "",
  fluid = false,
}: {
  children: ReactNode;
  className?: string;
  // fluid: span 100% of the viewport, inset to line up with the home header pill
  fluid?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full ${
        fluid
          ? "px-5 sm:px-6 lg:px-[calc(clamp(20px,2.0175vw,40px)+clamp(24px,2.9vw,52px))]"
          : "max-w-[1280px] px-5 sm:px-6 lg:px-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}
