"use client";

import React from "react";

type BorderProps = React.SVGProps<SVGSVGElement> & {
  variant?: "box" | "capsule" | "underline";
};

const TitleBorder: React.FC<BorderProps> = ({
  variant = "box",
  className,
  ...props
}) => {
  if (variant === "capsule") {
    return (
      <svg
        viewBox="0 0 600 140"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full max-w-lg h-auto ${className || ""}`}
        {...props}
      >
        <defs>
          <linearGradient id="capsuleGrad" x1="0" x2="1">
            <stop offset="0" stopColor="#00C2FF" />
            <stop offset="1" stopColor="#6C5CE7" />
          </linearGradient>
        </defs>
        <rect
          x="10"
          y="30"
          width="580"
          height="70"
          rx="35"
          ry="35"
          fill="none"
          stroke="url(#capsuleGrad)"
          strokeWidth="2.5"
          opacity="0.95"
        />
      </svg>
    );
  }

  if (variant === "underline") {
    return (
      <svg
        viewBox="0 0 120 6"
        width="230"
        height="6"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <defs>
          <linearGradient id="underlineGrad" x1="0" x2="1">
            <stop offset="0" stopColor="#00C2FF" />
            <stop offset="1" stopColor="#6C5CE7" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="1"
          width="120"
          height="4"
          rx="2"
          fill="url(#underlineGrad)"
        />
      </svg>
    );
  }

  // default = box
  return (
    <svg
      viewBox="0 0 800 120"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-20 ${className || ""}`}
      {...props}
    >
      <rect
        x="12"
        y="28"
        width="776"
        height="72"
        rx="12"
        ry="12"
        fill="none"
        stroke="rgba(108,92,231,0.1)"
        strokeWidth="2"
      />
      <rect
        x="8"
        y="24"
        width="784"
        height="80"
        rx="14"
        ry="14"
        fill="none"
        stroke="rgba(108,92,231,0.06)"
        strokeWidth="1"
      />
    </svg>
  );
};

export default TitleBorder;
