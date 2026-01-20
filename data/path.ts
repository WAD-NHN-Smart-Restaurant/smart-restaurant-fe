export const AUTH_PATHS = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
};

export const PROTECTED_PATHS = {
  TABLES: {
    INDEX: "/tables",
    CREATE: "/tables/create",
    EDIT: (id: string) => `/tables/${id}/edit`,
  },
  ORDER_HISTORY: "/order-history",
};

export const PUBLIC_PATHS = {
  MENU: {
    INDEX: "/menu",
  },
  ORDER_INFO: "/order-info",
};

// All paths combined for easy access
export const PATHS = {
  ...AUTH_PATHS,
  ...PROTECTED_PATHS,
  ...PUBLIC_PATHS,
};
