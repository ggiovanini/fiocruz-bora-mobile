export const missions = [
  {
    id: "movement",
    title: "Movimente-se",
    category: "Movimento",
    description:
      "Reserve um momento para se movimentar e registre a atividade.",
    activity: "Caminhada",
    goal: 20,
  },
  {
    id: "pause",
    title: "Pausa consciente",
    category: "Bem-estar",
    description: "Faça uma pausa na rotina e registre esse momento.",
    activity: "Pausa de bem-estar",
    goal: 5,
  },
  {
    id: "reading",
    title: "Tempo para aprender",
    category: "Conteúdo",
    description: "Dedique um tempo à leitura e registre a atividade.",
    activity: "Leitura",
    goal: 10,
  },
] as const;
export const articles = [
  {
    id: "pause",
    title: "Uma pausa no seu dia",
    category: "Bem-estar",
    summary: "Espaço reservado para conteúdo revisado pela equipe do piloto.",
  },
  {
    id: "routine",
    title: "Pequenas escolhas na rotina",
    category: "Hábitos",
    summary:
      "Texto, imagem ou vídeo e autoria serão incluídos após revisão editorial.",
  },
];
export const pilotEvent = {
  id: "pilot-meeting",
  title: "Encontro Bóra",
  when: "Data e horário a definir",
  where: "Local a confirmar · Cogetic",
};
export const statusLabels = {
  pending: "Pendente",
  sending: "Enviando",
  confirmed: "Confirmada",
  failed: "Falhou",
} as const;
