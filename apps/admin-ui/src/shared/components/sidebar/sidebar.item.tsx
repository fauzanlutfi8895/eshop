import Link from "next/link";

type Props = {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string;
  onClick?: () => void;
};

const SidebarItem = ({ title, icon, isActive, href, onClick }: Props) => {
  const baseClass = `flex gap-2 w-full min-h-12 h-full items-center px-[13px] rounded-lg cursor-pointer transition hover:bg-[#2b2f31] ${
    isActive &&
    "scale-[.98] bg-[#0f3158] fill-blue-200 hover:bg-[#0f3158d6]"
  }`;

  const content = (
    <div className={baseClass}>
      {icon}
      <h5 className="text-slate-200 text-lg">{title}</h5>
    </div>
  );

  // Jika href ada → pakai Link, kalau tidak → pakai button
  return href ? (
    <Link href={href} className="my-2 block">
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className="my-2 w-full text-left block">
      {content}
    </button>
  );
};

export default SidebarItem;
