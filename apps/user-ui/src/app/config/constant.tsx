export const navItem: NavItemsType[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Product",
    href: "/products",
  },
  {
    title: "Shops",
    href: "/shops",
  },
  {
    title: "Offers",
    href: "/offers",
  },
  {
    title: "Become a seller",
    href: `${process.env.NEXT_PUBLIC_SELLER_SERVER_URI}/signup`,
  },
];
