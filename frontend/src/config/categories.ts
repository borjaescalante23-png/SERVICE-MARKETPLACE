export interface CategoryDef {
  id: string;
  label: string;
  icon: string;
}

export interface GroupDef {
  id: string;
  label: string;
  icon: string;
  categories: CategoryDef[];
}

export const SERVICE_GROUPS: GroupDef[] = [
  {
    id: 'HOGAR',
    label: 'Hogar',
    icon: 'Home',
    categories: [
      { id: 'CLEANING', label: 'Limpieza', icon: 'Sparkles' },
      { id: 'PLUMBING', label: 'Fontanería', icon: 'Wrench' },
      { id: 'ELECTRICIAN', label: 'Electricista', icon: 'Zap' },
      { id: 'HANDYMAN', label: 'Manitas', icon: 'Hammer' },
      { id: 'PAINTING', label: 'Pintura', icon: 'Paintbrush' },
      { id: 'LOCKSMITH', label: 'Cerrajería', icon: 'KeyRound' },
      { id: 'IRONING', label: 'Plancha', icon: 'Shirt' },
      { id: 'FURNITURE', label: 'Montaje de Muebles', icon: 'Package' },
      { id: 'GARDENING', label: 'Jardinería', icon: 'Leaf' },
      { id: 'POOL', label: 'Piscinas', icon: 'Waves' },
      { id: 'UPHOLSTERY', label: 'Limpieza de Tapicería', icon: 'Armchair' },
    ],
  },
  {
    id: 'BIENESTAR',
    label: 'Bienestar y Belleza',
    icon: 'Heart',
    categories: [
      { id: 'MASSAGE', label: 'Masajes', icon: 'Heart' },
      { id: 'HAIRDRESSING', label: 'Peluquería', icon: 'Scissors' },
      { id: 'AESTHETICS', label: 'Estética', icon: 'Sparkles' },
      { id: 'MANICURE', label: 'Manicura y Pedicura', icon: 'Hand' },
      { id: 'MAKEUP', label: 'Maquillaje', icon: 'Palette' },
      { id: 'PHYSIOTHERAPY', label: 'Fisioterapia', icon: 'Activity' },
      { id: 'NUTRITION', label: 'Nutrición', icon: 'Apple' },
    ],
  },
  {
    id: 'DEPORTE',
    label: 'Deporte y Fitness',
    icon: 'Dumbbell',
    categories: [
      { id: 'PERSONAL_TRAINER', label: 'Entrenador Personal', icon: 'Dumbbell' },
      { id: 'YOGA', label: 'Yoga', icon: 'Wind' },
      { id: 'PILATES', label: 'Pilates', icon: 'CircleDot' },
      { id: 'TENNIS', label: 'Tenis', icon: 'Circle' },
      { id: 'PADEL', label: 'Pádel', icon: 'Circle' },
      { id: 'BOXING', label: 'Boxeo', icon: 'Shield' },
    ],
  },
  {
    id: 'CLASES',
    label: 'Clases y Tutorías',
    icon: 'BookOpen',
    categories: [
      { id: 'TUTORING', label: 'Clases Particulares', icon: 'BookOpen' },
      { id: 'LANGUAGES', label: 'Idiomas', icon: 'Globe' },
      { id: 'MUSIC', label: 'Música', icon: 'Music' },
      { id: 'ART_CLASSES', label: 'Pintura y Arte', icon: 'Paintbrush' },
      { id: 'DANCE', label: 'Baile', icon: 'Music2' },
      { id: 'COOKING_CLASS', label: 'Cocina', icon: 'UtensilsCrossed' },
    ],
  },
  {
    id: 'CUIDADOS',
    label: 'Cuidados',
    icon: 'Users',
    categories: [
      { id: 'ELDERLY_CARE', label: 'Cuidado de Mayores', icon: 'Users' },
      { id: 'CHILDCARE', label: 'Cuidado de Niños', icon: 'Baby' },
      { id: 'PET_CARE', label: 'Cuidado de Mascotas', icon: 'PawPrint' },
      { id: 'DOG_WALKING', label: 'Paseo de Perros', icon: 'PawPrint' },
    ],
  },
  {
    id: 'TECNOLOGIA',
    label: 'Tecnología',
    icon: 'Monitor',
    categories: [
      { id: 'TECH_SUPPORT', label: 'Soporte Técnico', icon: 'Monitor' },
      { id: 'WEB_DESIGN', label: 'Diseño Web', icon: 'Globe' },
    ],
  },
  {
    id: 'OTROS',
    label: 'Otros',
    icon: 'Grid',
    categories: [
      { id: 'PHOTOGRAPHY', label: 'Fotografía de Eventos', icon: 'Camera' },
      { id: 'MOVING', label: 'Mudanzas', icon: 'Truck' },
      { id: 'CHEF', label: 'Chef a Domicilio', icon: 'UtensilsCrossed' },
      { id: 'CATERING', label: 'Catering', icon: 'Coffee' },
      { id: 'VIDEO', label: 'Videografía', icon: 'Video' },
      { id: 'DJ', label: 'DJ para Eventos', icon: 'Music' },
    ],
  },
];

export const ALL_CATEGORIES: CategoryDef[] = SERVICE_GROUPS.flatMap(g => g.categories);

export const getCategoryLabel = (id: string): string =>
  ALL_CATEGORIES.find(c => c.id === id)?.label ?? id;

export const getCategoryGroup = (id: string): GroupDef | undefined =>
  SERVICE_GROUPS.find(g => g.categories.some(c => c.id === id));

export const getGroupLabel = (id: string): string =>
  SERVICE_GROUPS.find(g => g.id === id)?.label ?? id;
