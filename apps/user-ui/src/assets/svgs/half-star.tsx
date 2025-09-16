import React from "react";

type StarProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  title?: string | null;
};

export default function StarHalf({
  size = 24,
  color = "currentColor",
  title = "",
  className = "",
  ...props
}: StarProps) {
  const isDecorative = !title;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      role={isDecorative ? "img" : "img"}
      aria-hidden={isDecorative}
      aria-label={isDecorative ? undefined : title || "Half Star"}
      className={className}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 2l2.09 6.63L21 9.24l-5.46 4.73L17.82 21 12 17.27V2z" />
      <path
        d="M12 2L9.91 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27V2z"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
    </svg>
  );
}