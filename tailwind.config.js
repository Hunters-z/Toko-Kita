export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: {
      // CSS variables (shadcn) — dipetakan ke token FinPoint
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
      secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
      destructive: { DEFAULT: '#DC2626', foreground: '#FFFFFF' },
      muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
      accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
      popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
      card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      // Light premium: putih + aksen biru (FinPoint)
      bg:'#F4F6FA', card2:'#F1F3F8', line:'#E6E9F0',
      ink:'#10131A', inksoft:'#5C6470', dim:'#9AA1AD',
      hero:{DEFAULT:'#2563EB', soft:'#EAF0FE'},
      lime:{DEFAULT:'#16A34A', soft:'#E8F7EE'},
      gold:{DEFAULT:'#D97706', soft:'#FEF3E2'},
      coral:{DEFAULT:'#DC2626', soft:'#FDECEC'},
      bluea:{DEFAULT:'#2563EB', soft:'#EAF0FE'},
      // alias kelas lama
      paper:'#F1F3F8', ocean:{DEFAULT:'#2563EB',ink:'#1D4ED8',deep:'#1E40AF',soft:'#EAF0FE'},
      navy:{DEFAULT:'#10131A',mid:'#1A1F2B'},
      amber:{DEFAULT:'#D97706', soft:'#FEF3E2'},
      mint:{DEFAULT:'#16A34A', soft:'#E8F7EE'},
    },
    fontFamily: { disp:['Sora','sans-serif'], body:['"Plus Jakarta Sans"','sans-serif'] },
    boxShadow: { soft:'0 2px 12px rgba(16,19,26,.06)', pop:'0 10px 30px rgba(37,99,235,.18)' },
    borderRadius: { xl2:'20px' },
  } },
  plugins: [require('tailwindcss-animate')]
}
