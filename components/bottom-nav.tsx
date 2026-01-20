"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { Home, ShoppingCart, Receipt, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { AuthRequiredModal } from "./auth-required-modal";

const CUSTOMER_ROUTES = ["/profile"];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { getItemCount } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const { user, isAuthenticated } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);

  // Update cart count after hydration
  useEffect(() => {
    setCartCount(getItemCount());
  }, [getItemCount]);

  const navItems = [
    { href: "/menu", label: "Menu", icon: Home },
    { href: "/checkout", label: "Cart", icon: ShoppingCart, badge: cartCount },
    { href: "/order-info", label: "Orders", icon: Receipt },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const handleNavigate = (href: string) => {
    const isCustomerRoute = CUSTOMER_ROUTES.includes(href);

    if (isCustomerRoute && !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    router.push(href);
  };

  return (
    <>
      <div className="bottom-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => handleNavigate(item.href)}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">
                <Icon size={24} />
              </span>

              {item.badge !== undefined && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={(open) => setShowAuthModal(open)}
      />
    </>
  );
}
