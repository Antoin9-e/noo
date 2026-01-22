/**
 * Palette de couleurs Noo
 * Inspirée du design de la page de connexion
 */

export const colors = {
  // Dégradé principal (gauche de la page auth)
  gradient: {
    from: "#5B21B6", // violet-800
    via1: "#A21CAF", // fuchsia-700
    via2: "#D946EF", // fuchsia-500
    via3: "#F0ABFC", // fuchsia-300
    via4: "#FDBA74", // orange-300
    to: "#FEF3C7", // amber-100
  },

  // Couleurs primaires
  primary: {
    violet: "#5B21B6", // violet-800
    fuchsia: "#D946EF", // fuchsia-500
    orange: "#FDBA74", // orange-300
    amber: "#FEF3C7", // amber-100
  },

  // Arrière-plans
  background: {
    light: "#F3F4F6", // gray-100
    white: "#FFFFFF",
    dark: "#1F2937", // gray-800
  },

  // Texte
  text: {
    primary: "#FFFFFF", // white
    secondary: "#4B5563", // gray-600
    link: "#2563EB", // blue-600
  },

  // Ombres
  shadow: {
    glow: "rgba(139, 92, 246, 0.35)", // violet glow
    card: "rgba(0, 0, 0, 0.1)",
  },
} as const;

/**
 * Classes Tailwind correspondantes
 */
export const tailwindColors = {
  gradient:
    "from-violet-800 via-fuchsia-700 via-fuchsia-500 via-fuchsia-300 via-orange-300 to-amber-100",
  bgLight: "bg-gray-100",
  textWhite: "text-white",
  textGray: "text-gray-600",
  linkBlue: "text-blue-600",
} as const;
