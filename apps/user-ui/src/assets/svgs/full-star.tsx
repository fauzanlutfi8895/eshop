import React from "react";

type StarProps = React.SVGProps<SVGSVGElement> & {
  /** ukuran dalam px atau string CSS (default: 24) */
  size?: number | string;
  /** warna isi bintang (default: currentColor) */
  color?: string;
  /** teks aksesibilitas (jika kosong, svg dianggap dekoratif) */
  title?: string | null;
};

export default function StarFull({
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
      aria-label={isDecorative ? undefined : title || "Star"}
      className={className}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
