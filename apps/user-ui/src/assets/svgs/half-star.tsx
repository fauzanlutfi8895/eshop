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
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={isDecorative}
      aria-label={isDecorative ? undefined : title || "Half Star"}
      className={className}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      {/* Definisi clipPath untuk isi setengah kiri */}
      <defs>
        <clipPath id="half-clip">
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>

      {/* Outline bintang */}
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 
           9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill="none"
        stroke={color}
        strokeWidth="0"
      />

      {/* Isi setengah kiri */}
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 
           9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={color}
        clipPath="url(#half-clip)"
      />
    </svg>
  );
}
