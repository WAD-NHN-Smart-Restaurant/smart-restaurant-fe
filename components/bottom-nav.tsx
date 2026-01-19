"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { Home, ShoppingCart, Receipt, User } from "lucide-react";
import { useEffect, useState } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const { getItemCount } = useCart();
  const [cartCount, setCartCount] = useState(0);

  // Update cart count after hydration
  useEffect(() => {
    setCartCount(getItemCount());
  }, [getItemCount]);

  const navItems = [
    { href: "/menu", label: "Menu", icon: Home },
    { href: "/checkout", label: "Cart", icon: ShoppingCart, badge: cartCount },
    { href: "/order-info", label: "Orders", icon: Receipt },
    { href: "/login", label: "Profile", icon: User },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">
              <Icon size={24} />
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="nav-badge">{item.badge}</span>
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
