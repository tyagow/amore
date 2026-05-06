import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "pt-BR";

const STORAGE_KEY = "amore-locale";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Portugues",
};

const ORIGINAL_TEXT_NODES = new WeakMap<
  Text,
  { original: string; lastApplied: string | null }
>();
const ORIGINAL_ELEMENT_ATTRS = new WeakMap<Element, Map<string, string>>();

const PT_BR_COPY: Record<string, string> = {
  "Something went wrong": "Algo deu errado",
  "Something went wrong — Amore Couples": "Algo deu errado — Amore Couples",
  "An unexpected error occurred.": "Ocorreu um erro inesperado.",
  "Try again": "Tentar novamente",
  Cancel: "Cancelar",
  Save: "Salvar",
  "Saving...": "Salvando...",
  Accept: "Aceitar",
  "Accepting...": "Aceitando...",
  Decline: "Recusar",
  Later: "Depois",
  Install: "Instalar",
  Edit: "Editar",
  Manual: "Manual",
  "Priorize seguranca agora": "Priorize seguranca agora",
  "Prioritize safety right now": "Priorize a seguranca agora",
  "This may involve danger, crisis, or abuse. Amore should not mediate this or draft a repair message to send right now.":
    "Isso pode envolver perigo, crise ou abuso. O Amore nao deve mediar isso nem rascunhar uma mensagem de reparo para enviar agora.",
  "What partner mode unlocks": "O que o modo parceria libera",
  "Enter their email address. They'll need an Amore account to accept; your private import preview is not included in the invite.":
    "Digite o email da pessoa. Ela precisara de uma conta Amore para aceitar; sua pre-visualizacao privada de importacao nao e incluida no convite.",
  "Progress": "Progresso",
  "Reconnect": "Reconectar",
  "Document": "Documento",
  "Connected": "Conectado",
  "Disconnected": "Desconectado",
  "Appreciate": "Agradecer",
  "Reassure": "Reafirmar",
  "Communication": "Comunicacao",
  "Coaching": "Orientacao",
  "Conflict": "Conflito",
  "Sentiment": "Sentimento",
  "Overview": "Visao geral",
  "Emotions": "Emocoes",
  "Discoveries": "Descobertas",
  "Milestones": "Marcos",
  "Wishlist": "Lista de desejos",
  "Positive": "Positivo",
  "Negative": "Negativo",
  "Reassurance": "Reafirmacao",
  "Description": "Descricao",
  "Interests": "Interesses",
  "messages": "mensagens",
  "Understand": "Entender",
  "Sign in": "Entrar",
  "Sign In": "Entrar",
  "Sign Out": "Sair",
  "Sign up": "Criar conta",
  "Get Started": "Comecar",
  "Already have an account?": "Ja tem uma conta?",
  "Don't have an account?": "Ainda nao tem uma conta?",
  Email: "Email",
  "Password": "Senha",
  "Signing in...": "Entrando...",
  "Login failed": "Falha ao entrar",
  Home: "Inicio",
  Dashboard: "Painel",
  Insights: "Insights",
  Loading: "Carregando",
  "Loading insights": "Carregando insights",
  "Preparing your relationship patterns":
    "Preparando os padroes do relacionamento",
  Goals: "Metas",
  Chat: "Chat",
  WhatsApp: "WhatsApp",
  Profile: "Perfil",
  Coach: "Orientador",
  "Connection Requests": "Pedidos de conexao",
  Connect: "Conectar",
  "Open coach": "Abrir orientador",
  Close: "Fechar",
  "Back to Dashboard": "Voltar ao painel",
  "Relationship Profile": "Perfil do relacionamento",
  "How you show up in your relationship": "Como voce aparece no relacionamento",
  "Your Profile": "Seu perfil",
  "Jaluza’s Profile": "Perfil da Jaluza",
  "Love Languages": "Linguagens do amor",
  "Words of Affirmation": "Palavras de afirmacao",
  "Words of affirmation": "Palavras de afirmacao",
  "Acts of Service": "Atos de servico",
  "Acts of service": "Atos de servico",
  "Receiving Gifts": "Presentes",
  "Receiving gifts": "Presentes",
  "Quality Time": "Tempo de qualidade",
  "Quality time": "Tempo de qualidade",
  "Physical Touch": "Toque fisico",
  "Physical touch": "Toque fisico",
  "Communication Style": "Estilo de comunicacao",
  "Shared Interests": "Interesses compartilhados",
  Notifications: "Notificacoes",
  "Push notifications": "Notificacoes push",
  "This device is receiving push notifications":
    "Este dispositivo esta recebendo notificacoes push",
  "Not enabled on this device": "Nao ativadas neste dispositivo",
  Disable: "Desativar",
  "Notification types": "Tipos de notificacao",
  "Mood alerts": "Alertas de humor",
  "When your partner shares their mood":
    "Quando sua parceria compartilha o humor",
  "Coach nudges": "Toques do orientador",
  "Conflict alerts, score drops, coaching tips":
    "Alertas de conflito, quedas de pontuacao e dicas de orientacao",
  "Score drops": "Quedas de pontuacao",
  "When your health score drops significantly":
    "Quando sua pontuacao de saude cai bastante",
  "Health score achievements": "Conquistas de pontuacao de saude",
  "Goal updates": "Atualizacoes de metas",
  "When your partner completes a goal": "Quando sua parceria conclui uma meta",
  "Weekly digest": "Resumo semanal",
  "Email summary every Sunday": "Resumo por email todo domingo",
  "Quiet hours": "Horario silencioso",
  to: "ate",
  "Set timezone to America/Sao_Paulo": "Definir fuso como America/Sao_Paulo",
  "File is too large. Maximum size is 5MB.":
    "O arquivo e grande demais. O tamanho maximo e 5 MB.",
  "No .txt file found inside the zip. Please select the WhatsApp .txt export directly.":
    "Nenhum arquivo .txt foi encontrado no zip. Selecione diretamente a exportacao .txt do WhatsApp.",
  "Failed to read the zip file. Please try uploading the .txt file directly.":
    "Falha ao ler o zip. Tente enviar diretamente o arquivo .txt.",
  "Could not detect conversation participants.":
    "Nao foi possivel detectar os participantes da conversa.",
  "Failed to parse the file.": "Falha ao interpretar o arquivo.",
  "Analysis failed.": "A analise falhou.",
  "Upload a WhatsApp chat": "Enviar uma conversa do WhatsApp",
  "Export a conversation from WhatsApp, upload the .txt file, and get relationship insights in under a minute.":
    "Exporte uma conversa do WhatsApp, envie o arquivo .txt e receba insights do relacionamento em menos de um minuto.",
  "Drop a file here or click to browse":
    "Solte um arquivo aqui ou clique para escolher",
  "View full dashboard": "Ver painel completo",
  "No love language data yet. Edit your profile or run an AI analysis.":
    "Ainda nao ha dados de linguagem do amor. Edite seu perfil ou rode uma analise de IA.",
  "No communication style data yet. Edit your profile or run an AI analysis.":
    "Ainda nao ha dados de estilo de comunicacao. Edite seu perfil ou rode uma analise de IA.",
  "No interests data yet. Edit your profile or run an AI analysis.":
    "Ainda nao ha dados de interesses. Edite seu perfil ou rode uma analise de IA.",
  "Not set yet": "Ainda nao definido",
  "Things you want to work on together":
    "Coisas que voces querem praticar juntos",
  "Choose one couple practice for this week":
    "Escolha uma pratica do casal para esta semana",
  "The best goal is small enough to do even on a busy day.":
    "A melhor meta e pequena o bastante para caber ate em um dia cheio.",
  "Create for this week": "Criar para esta semana",
  "Invite partner first": "Convidar a parceria primeiro",
  "Add Goal": "Adicionar meta",
  "Get AI Suggestions": "Receber sugestoes da IA",
  "Active Goals": "Metas ativas",
  "Completed (1)": "Concluidas (1)",
  "Mark complete": "Marcar como concluida",
  "Discuss in chat": "Conversar no chat",
  "Do today": "Fazer hoje",
  "Check progress": "Checar progresso",
  "Plan support": "Planejar apoio",
  "Make easier": "Facilitar",
  "Repair slip": "Reparar deslize",
  "Deep dive into your relationship patterns and growth":
    "Mergulhe nos padroes e no crescimento do relacionamento",
  "TODAY'S ACTION PLAN": "PLANO DE ACAO DE HOJE",
  "Health Score Trend": "Tendencia da saude",
  "Health Score": "Pontuacao de saude",
  "Total messages": "Total de mensagens",
  "Day streak": "Sequencia de dias",
  "Consecutive days": "Dias consecutivos",
  "Last analysis": "Ultima analise",
  "AI insights": "Insights da IA",
  "Recent Insights": "Insights recentes",
  "Draft repair message": "Rascunhar mensagem de reparo",
  "Make it a goal": "Transformar em meta",
  "Ask coach to help": "Pedir ajuda ao orientador",
  "Ask coach": "Perguntar ao orientador",
  "Resync messages": "Ressincronizar mensagens",
  "Load earlier messages": "Carregar mensagens anteriores",
  "AI relationship context": "Contexto do relacionamento para IA",
  "AI active": "IA ativa",
  "&middot; analyzed": "&middot; analisado",
  "new messages": "novas mensagens",
  "Current Mood": "Humor atual",
  "Coaching Tips": "Dicas de orientacao",
  "Reply Suggestions": "Sugestoes de resposta",
  "Use this reply": "Usar esta resposta",
  "Tension Detected": "Tensao detectada",
  "The conversation tone suggests some friction. Consider a warm, understanding approach.":
    "O tom da conversa sugere algum atrito. Considere uma abordagem acolhedora e compreensiva.",
  "more saved in discoveries.": "mais salvos em descobertas.",
  "Learning Your Patterns": "Aprendendo os padroes de voces",
  "Chat with your partner and I'll start learning your patterns. Insights appear after a few messages.":
    "Converse com sua parceria e eu vou comecar a aprender os padroes de voces. Os insights aparecem depois de algumas mensagens.",
  "Syncing messages from WhatsApp...": "Sincronizando mensagens do WhatsApp...",
  "What I felt...": "O que eu senti...",
  "What I can own...": "O que eu posso assumir...",
  "What I need...": "O que eu preciso...",
  "Could we...": "Poderiamos...",
  "Build repair": "Criar reparo",
  "Why it matters...": "Por que isso importa...",
  "I am flexible about...": "Tenho flexibilidade sobre...",
  "Build need": "Criar pedido",
  "What I noticed...": "O que eu percebi...",
  "What it showed me...": "O que isso me mostrou...",
  "How it landed...": "Como isso chegou...",
  "Build appreciation": "Criar apreciacao",
  "What I did...": "O que eu fiz...",
  "Impact I can see...": "Impacto que eu consigo ver...",
  "What I own...": "O que eu assumo...",
  "Repair ask...": "Pedido de reparo...",
  "Build apology": "Criar pedido de desculpas",
  "What happened...": "O que aconteceu...",
  "Story I told myself...": "Historia que contei para mim...",
  "Build conflict map": "Criar mapa do conflito",
  "Reassurance...": "Reafirmacao...",
  "Why I need space...": "Por que preciso de espaco...",
  "When I will return...": "Quando vou voltar...",
  "Build space request": "Criar pedido de espaco",
  "What I missed...": "O que eu perdi...",
  "How it may have landed...": "Como pode ter chegado...",
  "What I wish I had done...": "O que eu gostaria de ter feito...",
  "Can I...": "Posso...",
  "Build missed-bid repair": "Criar reparo da tentativa perdida",
  "What I heard...": "O que eu ouvi...",
  "What they felt...": "O que a pessoa sentiu...",
  "One part I can own...": "Uma parte que posso assumir...",
  "One clarifying question...": "Uma pergunta de esclarecimento...",
  "Build listening reply": "Criar resposta de escuta",
  "The complaint...": "A queixa...",
  "The longing underneath...": "O desejo por tras...",
  "Could we try...": "Poderiamos tentar...",
  "One thing I appreciate...": "Uma coisa que eu aprecio...",
  "Build longing request": "Criar pedido de desejo",
  "Soften this": "Suavizar isto",
  "Pause instead": "Pausar em vez disso",
  "WhatsApp Disconnected": "WhatsApp desconectado",
  "Your WhatsApp session has ended. Reconnect to continue chatting.":
    "Sua sessao do WhatsApp terminou. Reconecte para continuar conversando.",
  "No messages yet. Messages you send here will appear in your partner's WhatsApp.":
    "Ainda nao ha mensagens. As mensagens enviadas aqui aparecerao no WhatsApp da sua parceria.",
  "New messages": "Novas mensagens",
  "Suggested revision:": "Revisao sugerida:",
  "Use revised version": "Usar versao revisada",
  "Connecting...": "Conectando...",
  "Reconnecting...": "Reconectando...",
  "Logged out": "Desconectado",
  "Session expired": "Sessao expirada",
  "New conversation": "Nova conversa",
  "Delete conversation": "Excluir conversa",
  "No coach conversations yet": "Ainda nao ha conversas com o orientador",
  "Start one and the coach will keep the thread history here.":
    "Comece uma conversa e o orientador vai manter o historico aqui.",
  "Coach nudge": "Toque do orientador",
  "Talk about it": "Conversar sobre isso",
  Dismiss: "Dispensar",
  "Untitled conversation": "Conversa sem titulo",
  Updated: "Atualizado",
  "Prepare repair": "Preparar reparo",
  "Ask a better question": "Fazer uma pergunta melhor",
  "Choose one goal": "Escolher uma meta",
  "Plan apology": "Planejar pedido de desculpas",
  "Start with a hard thing": "Comecar por algo dificil",
  "This sounds final while activated":
    "Isso soa definitivo em um momento ativado",
  "Relationship-ending language can be hard to take back. If you are flooded, send a pause with a return time before deciding what you mean.":
    "Linguagem de termino pode ser dificil de retirar. Se voce esta tomado, envie uma pausa com hora de retorno antes de decidir o que realmente quer dizer.",
  "This may land as contempt": "Isso pode soar como desprezo",
  "Name the hurt without labeling your partner. A softer start or space request is more likely to keep repair possible.":
    "Nomeie a dor sem rotular sua parceria. Um comeco mais suave ou um pedido de espaco aumenta a chance de reparo.",
  "This may land as blame": "Isso pode soar como culpa",
  "Try naming the feeling and one specific event instead of a global pattern. That gives your partner something they can respond to.":
    "Tente nomear o sentimento e um evento especifico em vez de um padrao geral. Isso da a sua parceria algo concreto para responder.",
  "This is a lot to receive at once": "Isso e muito para receber de uma vez",
  "Consider sending the core point first, then asking if they can keep talking. Shorter repair attempts are easier to answer.":
    "Considere enviar primeiro o ponto principal e depois perguntar se a pessoa consegue continuar. Tentativas de reparo mais curtas sao mais faceis de responder.",
  "Toggle conversation history": "Alternar historico da conversa",
  "Conversation history": "Historico de conversas",
  "Relationship coach": "Orientador de relacionamento",
  "Switch or clear old threads": "Troque ou limpe conversas antigas",
  "Direct guidance with your real relationship context":
    "Orientacao direta com o contexto real do relacionamento",
  Relationship: "Relacionamento",
  Context: "Contexto",
  "Close coach": "Fechar orientador",
  "Context:": "Contexto:",
  "Ask about tension, communication, goals, or what your recent patterns mean.":
    "Pergunte sobre tensao, comunicacao, metas ou o significado dos padroes recentes.",
  "The coach uses your relationship history, recent insights, and prior coaching threads to answer directly.":
    "O orientador usa o historico do relacionamento, insights recentes e conversas anteriores para responder diretamente.",
  "Ask your coach...": "Pergunte ao orientador...",
  "Stop coach response": "Parar resposta do orientador",
  "Send coach message": "Enviar mensagem ao orientador",
  "{name} might need some support right now":
    "{name} pode precisar de apoio agora",
  "They shared that they're": "A pessoa compartilhou que esta",
  "feeling low": "se sentindo para baixo",
  struggling: "com dificuldade",
  "might need some support right now": "pode precisar de apoio agora",
  "They shared that they&apos;re": "A pessoa compartilhou que esta",
  "Dismiss coaching tips": "Dispensar dicas de orientacao",
  "% partner": "% parceria",
  "Pause phrase": "Frase de pausa",
  "Phone boundary": "Limite do celular",
  "Repair window": "Janela de reparo",
  "Do not mix in": "Nao misturar",
  "Before conflict": "Antes do conflito",
  "Make the hard-talk rules while calm":
    "Criar as regras das conversas dificeis enquanto ha calma",
  "Most couples do not need a bigger speech when tension rises. They need a shared stop sign, a repair window, and one boundary that keeps the conversation from spreading everywhere.":
    "A maioria dos casais nao precisa de um discurso maior quando a tensao sobe. Precisa de um sinal de parada compartilhado, uma janela de reparo e um limite que impeça a conversa de se espalhar para tudo.",
  "Propose agreement": "Propor acordo",
  "Repair agreement slip": "Reparar deslize do acordo",
  "Make agreement goal": "Criar meta do acordo",
  "No mood set": "Nenhum humor definido",
  "Draft message": "Rascunhar mensagem",
  "Care plan": "Plano de cuidado",
  "Repair first, then reconnect": "Reparar primeiro, depois reconectar",
  "Name one real appreciation, own one part without defending yourself, then ask what felt heavy and listen before responding.":
    "Nomeie uma apreciacao real, assuma uma parte sem se defender, depois pergunte o que ficou pesado e escute antes de responder.",
  "Pick one action that takes less than 20 minutes, say exactly when you will do it, and come back to mark it done instead of leaving it abstract.":
    "Escolha uma acao que leve menos de 20 minutos, diga exatamente quando vai fazer e volte para marcar como feita em vez de deixar abstrato.",
  Struggling: "Com dificuldade",
  "Checked in today": "Check-in feito hoje",
  "Your partner checked in too!": "Sua parceria tambem fez check-in!",
  "Invite theirs": "Convidar o check-in da parceria",
  "Today support ask": "Pedido de apoio de hoje",
  "Tell partner": "Contar para a parceria",
  "Make tonight plan": "Criar plano para hoje a noite",
  "Make support goal": "Criar meta de apoio",
  "Ask theirs too": "Perguntar o da parceria tambem",
  "Thank after help": "Agradecer depois da ajuda",
  "Check if it landed": "Checar como chegou",
  "Name what not to do": "Nomear o que evitar",
  "support ask": "pedido de apoio",
  "Respond with care": "Responder com cuidado",
  "Thank first": "Agradecer primeiro",
  "Ask what to avoid": "Perguntar o que evitar",
  "Daily Check-in": "Check-in diario",
  "Draft this message": "Rascunhar esta mensagem",
  "What would help your partner support you?":
    "O que ajudaria sua parceria a te apoiar?",
  "Share your thoughts (optional)...":
    "Compartilhe seus pensamentos (opcional)...",
  "Check In": "Fazer check-in",
  "7-day rhythm": "Ritmo de 7 dias",
  "Two moods per day: you first,": "Dois humores por dia: voce primeiro,",
  "/7 together": "/7 juntos",
  "Talk about rhythm": "Conversar sobre o ritmo",
  "Make rhythm tiny": "Deixar o ritmo pequeno",
  "Share the good while it is fresh":
    "Compartilhar o bom enquanto ainda esta fresco",
  "Positive moments become stronger when your partner hears what they did right.":
    "Momentos positivos ficam mais fortes quando sua parceria ouve o que fez bem.",
  "Turn good into connection": "Transformar o bom em conexao",
  "Use this as a low-pressure moment to ask how your partner is doing too.":
    "Use isso como um momento leve para perguntar tambem como sua parceria esta.",
  "Name the neutral without drifting": "Nomear o neutro sem se afastar",
  "Neutral is a good time for a small bid for closeness before distance grows.":
    "O neutro e um bom momento para uma pequena tentativa de proximidade antes que a distancia cresca.",
  "Ask for care clearly": "Pedir cuidado com clareza",
  "Low moods are easier to support when your partner knows whether you need listening, space, or help.":
    "Humores baixos sao mais faceis de apoiar quando sua parceria sabe se voce precisa de escuta, espaco ou ajuda.",
  "Make support easy to give": "Facilitar o apoio",
  "When things feel heavy, a clear and gentle ask is kinder than hoping your partner guesses.":
    "Quando as coisas pesam, um pedido claro e gentil e mais cuidadoso do que esperar que sua parceria adivinhe.",
  "Just listen": "So ouvir",
  "I could use listening, not fixing.": "Eu preciso de escuta, nao de solucao.",
  Warmth: "Acolhimento",
  "I could use warmth and reassurance.": "Eu preciso de carinho e reafirmacao.",
  "Practical help": "Ajuda pratica",
  "I could use practical help with one thing.":
    "Eu preciso de ajuda pratica com uma coisa.",
  "A little space": "Um pouco de espaco",
  "I could use a little space, but I still want us to feel okay.":
    "Eu preciso de um pouco de espaco, mas ainda quero que a gente fique bem.",
  "Check later": "Checar depois",
  "I could use a quick check-in later today.":
    "Eu preciso de um check-in rapido mais tarde hoje.",
  "Ask in chat": "Perguntar no chat",
  "Make a goal": "Criar uma meta",
  "Question of the day": "Pergunta do dia",
  "Ask what would help them feel less alone, offer clear choices, and accept their answer without making them explain everything.":
    "Pergunte o que ajudaria a pessoa a se sentir menos sozinha, ofereca escolhas claras e aceite a resposta sem faze-la explicar tudo.",
  "Use one question to lower defensiveness":
    "Use uma pergunta para reduzir a defensividade",
  "Ask what they wish you understood better about this week, then listen without defending yourself before you respond.":
    "Pergunte o que a pessoa gostaria que voce entendesse melhor sobre esta semana, depois escute sem se defender antes de responder.",
  "Find what is already working": "Encontrar o que ja esta funcionando",
  "Ask one small thing that recently helped them feel close, then share yours so the conversation notices what is working.":
    "Pergunte uma pequena coisa recente que ajudou a pessoa a se sentir proxima, depois compartilhe a sua para a conversa notar o que funciona.",
  "AI suggested": "Sugerido pela IA",
  "Notice progress": "Notar progresso",
  "Start with one promise you can keep this week.":
    "Comece com uma promessa que voce consegue cumprir esta semana.",
  "Try: one phone-free dinner, one appreciation message, or one repair conversation after tension.":
    "Tente: um jantar sem celular, uma mensagem de apreciacao ou uma conversa de reparo depois da tensao.",
  "Create a tiny goal": "Criar uma meta pequena",
  "No data yet": "Ainda sem dados",
  "Hot moment": "Momento quente",
  "Pause without disappearing": "Pausar sem desaparecer",
  "Use this when the conversation is too activated to keep going well. The draft protects the bond, names a return time, and makes the pause accountable.":
    "Use quando a conversa esta ativada demais para continuar bem. O rascunho protege o vinculo, nomeia uma hora de retorno e torna a pausa responsavel.",
  "Send pause request": "Enviar pedido de pausa",
  "Return script": "Roteiro de retorno",
  "Return time": "Hora de retorno",
  "20 minutes": "20 minutos",
  "While I pause, I will...": "Enquanto eu pauso, eu vou...",
  "breathe and come back ready to listen":
    "respirar e voltar pronto para escutar",
  "Draft preview": "Previa do rascunho",
  "I am getting sharp": "Estou ficando duro nas palavras",
  "I can feel my words getting pointed.":
    "Consigo sentir minhas palavras ficando pontudas.",
  "I am shutting down": "Estou me fechando",
  "I am going quiet and I do not want that to feel like punishment.":
    "Estou ficando quieto e nao quero que isso pareca punicao.",
  "I feel flooded": "Estou sobrecarregado",
  "My body is too activated for me to listen well right now.":
    "Meu corpo esta ativado demais para eu escutar bem agora.",
  "We are spiraling": "Estamos entrando em espiral",
  "We are repeating the same loop and I want to stop before we hurt each other more.":
    "Estamos repetindo o mesmo ciclo e quero parar antes que a gente se machuque mais.",
  "Turn into a repair message": "Transformar em mensagem de reparo",
  "Discuss this pattern": "Conversar sobre este padrao",
  "Send emotional check-in": "Enviar check-in emocional",
  "Honor this wish": "Honrar este desejo",
  "Plan with care": "Planejar com cuidado",
  "Act on this": "Agir sobre isso",
  "Talk it through": "Conversar ate entender",
  "Love Language": "Linguagem do amor",
  "Love languages haven't been detected yet. Keep chatting naturally and they'll emerge.":
    "As linguagens do amor ainda nao foram detectadas. Continuem conversando naturalmente e elas vao aparecer.",
  "No discoveries yet. Keep chatting naturally — the AI will learn about your love languages, interests, wishes, and important dates.":
    "Ainda sem descobertas. Continuem conversando naturalmente — a IA vai aprender sobre linguagens do amor, interesses, desejos e datas importantes.",
  "The signals worth acting on first.": "Os sinais que valem acao primeiro.",
  "View all": "Ver tudo",
  "more insight": "mais insight",
  "waiting on the full page.": "esperando na pagina completa.",
  "Connect WhatsApp to get relationship insights":
    "Conecte o WhatsApp para receber insights do relacionamento",
  "Discuss with partner": "Conversar com a parceria",
  "Draft softer repair": "Rascunhar reparo mais suave",
  "Active Tips": "Dicas ativas",
  "Tip History": "Historico de dicas",
  "Goal Suggestions": "Sugestoes de meta",
  "Conflict Alerts": "Alertas de conflito",
  "No message data yet": "Ainda sem dados de mensagens",
  "No daily message data yet": "Ainda sem dados diarios de mensagens",
  "No activity data yet": "Ainda sem dados de atividade",
  "Your avg. length": "Seu tamanho medio",
  "characters/message": "caracteres/mensagem",
  "Conversation move": "Movimento de conversa",
  "Turn the pattern into one small ask instead of just reading the chart.":
    "Transforme o padrao em um pequeno pedido em vez de apenas ler o grafico.",
  "Open in chat": "Abrir no chat",
  "Communication insights coming soon": "Insights de comunicacao em breve",
  "Keep chatting with your partner on WhatsApp. Once we have enough messages, detailed communication analytics will appear here.":
    "Continue conversando com sua parceria no WhatsApp. Quando houver mensagens suficientes, analises detalhadas de comunicacao aparecerao aqui.",
  "Message Balance": "Equilibrio de mensagens",
  "Daily Message Volume": "Volume diario de mensagens",
  "Last 14 days": "Ultimos 14 dias",
  "Active Hours": "Horas ativas",
  "When you chat the most": "Quando voces mais conversam",
  "Message Length": "Tamanho das mensagens",
  "Plan in chat": "Planejar no chat",
  "more wishes": "mais desejos",
  "days away": "dias de distancia",
  "more dates": "mais datas",
  "Discovery move": "Movimento de descoberta",
  "Make the discovery visible in the relationship, not just in the app.":
    "Torne a descoberta visivel no relacionamento, nao apenas no app.",
  "Important Dates": "Datas importantes",
  "There is a wish you can turn into care.":
    "Ha um desejo que voce pode transformar em cuidado.",
  "Choose one realistic way to honor this wish this week. Keep it thoughtful and voluntary, not another source of pressure.":
    "Escolha uma forma realista de honrar este desejo nesta semana. Mantenha cuidadoso e voluntario, nao mais uma fonte de pressao.",
  "There is an important date worth protecting.":
    "Ha uma data importante que vale proteger.",
  "Decide ahead of time how to make this date feel cared for, so it does not become a last-minute rush.":
    "Decida com antecedencia como cuidar desta data, para que ela nao vire correria de ultima hora.",
  "A shared interest can become quality time.":
    "Um interesse compartilhado pode virar tempo de qualidade.",
  "Plan one easy moment around this shared interest and ask what would make it enjoyable for both of you.":
    "Planeje um momento simples em torno desse interesse e pergunte o que tornaria isso bom para voces dois.",
  "Ask with curiosity, then reflect back one thing you learned so your partner feels seen instead of interviewed.":
    "Pergunte com curiosidade e depois reflita uma coisa que aprendeu para sua parceria se sentir vista, nao entrevistada.",
  "Use one discovery as a real check-in.":
    "Use uma descoberta como um check-in real.",
  "Ask one curiosity question this week":
    "Fazer uma pergunta curiosa esta semana",
  "Ask one thing your partner is enjoying, wanting, or thinking about, then listen without correcting or steering the answer.":
    "Pergunte uma coisa que sua parceria esta curtindo, querendo ou pensando, depois escute sem corrigir ou conduzir a resposta.",
  "There was a harder emotional day in the pattern.":
    "Houve um dia emocionalmente mais dificil no padrao.",
  "A low mood needs a gentle follow-up.":
    "Um humor baixo precisa de um acompanhamento gentil.",
  "Your emotional pattern looks steady enough to reinforce.":
    "O padrao emocional parece estavel o bastante para ser reforcado.",
  "Use the steadier moment to name one thing that worked, thank each other for it, and decide how to repeat the smallest version this week.":
    "Use o momento mais estavel para nomear uma coisa que funcionou, agradecer um ao outro por isso e decidir como repetir a menor versao nesta semana.",
  "No mood data": "Ainda sem dados de humor",
  "Emotional reset": "Reinicio emocional",
  "Turn it into one gentle check-in instead of waiting for tension to build.":
    "Transforme isso em um check-in gentil em vez de esperar a tensao crescer.",
  "Sentiment Trend": "Tendencia de sentimento",
  "Mood Timeline": "Linha do tempo do humor",
  "Best & Worst Days": "Melhores e piores dias",
  "Emotional Balance": "Equilibrio emocional",
  "Not enough health score data yet":
    "Ainda nao ha dados suficientes da pontuacao de saude",
  "No insights yet. Keep chatting to generate relationship insights.":
    "Ainda nao ha insights. Continue conversando para gerar insights do relacionamento.",
  "Repair first": "Reparar primeiro",
  "Have the 10-minute repair conversation":
    "Ter a conversa de reparo de 10 minutos",
  "Lower tension": "Reduzir tensao",
  "Turn the conflict signal into a softer opening":
    "Transformar o sinal de conflito em uma abertura mais suave",
  "Repair tension within 24 hours": "Reparar tensao em ate 24 horas",
  "Use softer starts for hard topics":
    "Usar comecos mais suaves para assuntos dificeis",
  "Before the next hard topic, lead with what you are feeling and what you want to understand. Keep the goal to lowering defensiveness, not winning the point.":
    "Antes do proximo assunto dificil, comece pelo que voce esta sentindo e pelo que quer entender. O objetivo e reduzir a defensividade, nao vencer o ponto.",
  "Choose one small practice this week":
    "Escolher uma pequena pratica esta semana",
  "There is already enough signal to pick one repeatable behavior. A tiny shared promise beats another passive insight.":
    "Ja ha sinal suficiente para escolher um comportamento repetivel. Uma pequena promessa compartilhada vale mais que outro insight passivo.",
  "One tiny relationship practice this week":
    "Uma pequena pratica de relacionamento esta semana",
  "Choose one repeatable behavior: a daily appreciation, one phone-free conversation, or a quick repair when something feels off. Keep it small enough to actually repeat.":
    "Escolha um comportamento repetivel: uma apreciacao diaria, uma conversa sem celular ou um reparo rapido quando algo ficar estranho. Mantenha pequeno o bastante para repetir de verdade.",
  "One appreciation message today": "Uma mensagem de apreciacao hoje",
  "Today's action plan": "Plano de acao de hoje",
  "Your insights will appear here": "Seus insights aparecerao aqui",
  "Connect WhatsApp and start chatting with your partner. We'll analyze your conversations and surface meaningful patterns, health scores, and coaching tips.":
    "Conecte o WhatsApp e comece a conversar com sua parceria. Vamos analisar as conversas e revelar padroes importantes, pontuacoes de saude e dicas de orientacao.",
  "Install Amore": "Instalar Amore",
  "Add to your home screen for the best experience":
    "Adicione a tela inicial para a melhor experiencia",
  "Invite in chat": "Convidar no chat",
  "Reschedule kindly": "Reagendar com cuidado",
  "Micro-date": "Microencontro",
  "Offer two low-pressure choices, let silence count as connection, and end by naming one thing you are grateful for.":
    "Ofereca duas escolhas leves, deixe o silencio contar como conexao e termine nomeando uma coisa pela qual voce sente gratidao.",
  "Reconnect without pretending nothing happened":
    "Reconectar sem fingir que nada aconteceu",
  "Start with something neutral, share one appreciation before discussing tension, and stop while the conversation still feels safe.":
    "Comece com algo neutro, compartilhe uma apreciacao antes de falar da tensao e pare enquanto a conversa ainda parece segura.",
  "Protect one small no-phone pocket":
    "Proteger um pequeno momento sem celular",
  "Pick one exact day and time, put phones away where neither person has to police it, then ask one real question and share one appreciation.":
    "Escolha um dia e horario exatos, guarde os celulares onde ninguem precise fiscalizar, depois faca uma pergunta real e compartilhe uma apreciacao.",
  "Mood Check-in": "Check-in de humor",
  "How are you feeling today?": "Como voce esta se sentindo hoje?",
  "No mood shared yet": "Nenhum humor compartilhado ainda",
  "Just for me": "So para mim",
  "Only you can see this": "So voce pode ver isso",
  "Your partner can see": "Sua parceria pode ver",
  "Notify your partner": "Notificar sua parceria",
  "Mood Check": "Checagem de humor",
  "It looks like you might be feeling":
    "Parece que voce pode estar se sentindo",
  "Is that right?": "Esta certo?",
  "Yes, that's right": "Sim, esta certo",
  "Not quite": "Nao exatamente",
  "How would you like to share this?":
    "Como voce gostaria de compartilhar isso?",
  "Your partner can see your mood": "Sua parceria pode ver seu humor",
  "Notify your partner immediately": "Notificar sua parceria imediatamente",
  "How are you feeling?": "Como voce esta se sentindo?",
  Sharing: "Compartilhamento",
  Silent: "Silencioso",
  Visible: "Visivel",
  Alert: "Alerta",
  "Draft support message": "Rascunhar mensagem de apoio",
  "Add a note (optional)...": "Adicionar uma nota (opcional)...",
  "Set Mood": "Registrar humor",
  "Choose what you want to be notified about":
    "Escolha sobre o que quer receber notificacoes",
  "Pause push notifications during these hours":
    "Pausar notificacoes push durante estes horarios",
  "Set timezone to": "Definir fuso como",
  "Timezone:": "Fuso:",
  "You're offline — some features may be unavailable":
    "Voce esta offline — alguns recursos podem estar indisponiveis",
  "Getting started": "Primeiros passos",
  "Sync messages": "Sincronizar mensagens",
  "messages synced": "mensagens sincronizadas",
  "WhatsApp connected": "WhatsApp conectado",
  "Connect WhatsApp": "Conectar WhatsApp",
  Disconnect: "Desconectar",
  "Disconnecting...": "Desconectando...",
  "Analyze patterns": "Analisar padroes",
  "Analyzing patterns...": "Analisando padroes...",
  "Health score": "Pontuacao de saude",
  "Health score:": "Pontuacao de saude:",
  "Generate insights": "Gerar insights",
  "Analysis complete!": "Analise concluida!",
  "vs last week": "vs semana passada",
  Activity: "Atividade",
  "/day avg": "/dia em media",
  "Stay in the loop": "Fique por dentro",
  "Get notified when your partner shares a mood or completes a goal — even when the app is closed.":
    "Receba notificacoes quando sua parceria compartilhar um humor ou concluir uma meta — mesmo com o app fechado.",
  "Today's relationship move": "Movimento de relacionamento de hoje",
  "The fastest way to make the app feel shared is a tiny daily ritual. Ask how they are feeling before trying to solve anything.":
    "A forma mais rapida de fazer o app parecer compartilhado e um pequeno ritual diario. Pergunte como a pessoa esta antes de tentar resolver qualquer coisa.",
  "Choose one small goal for this week":
    "Escolher uma pequena meta para esta semana",
  "Turn the insight into a visible commitment. Keep it tiny enough that both of you can actually do it.":
    "Transforme o insight em um compromisso visivel. Mantenha pequeno o bastante para os dois realmente conseguirem fazer.",
  "Do one caring thing on purpose": "Fazer uma coisa cuidadosa de proposito",
  "new messages are waiting to be understood.":
    "novas mensagens estao esperando para serem entendidas.",
  "Ask coach how": "Perguntar ao orientador como",
  "10-minute repair guide": "Guia de reparo de 10 minutos",
  "1. Appreciate first.": "1. Aprecie primeiro.",
  "Name one real thing before naming the problem.":
    "Nomeie uma coisa real antes de nomear o problema.",
  "2. Own your part.": "2. Assuma sua parte.",
  "Keep it short. No courtroom case.": "Seja breve. Sem tribunal.",
  "3. Ask to understand.": "3. Pergunte para entender.",
  "Invite their experience before proposing a fix.":
    "Convide a experiencia da pessoa antes de propor uma solucao.",
  "Ready-to-edit draft": "Rascunho pronto para editar",
  "Use this in chat": "Usar isto no chat",
  "2-minute appreciation": "Apreciacao de 2 minutos",
  "Send one specific thing you noticed and valued. Specific appreciation lands better than generic praise.":
    "Envie uma coisa especifica que voce percebeu e valorizou. Apreciacao especifica chega melhor que elogio generico.",
  "Soft check-in": "Check-in suave",
  "Ask about the emotional weather before solving anything. This keeps the conversation safe.":
    "Pergunte sobre o clima emocional antes de resolver qualquer coisa. Isso mantem a conversa segura.",
  "Repair after tension": "Reparar depois da tensao",
  "Use when something feels unresolved. It opens the door without blaming either person.":
    "Use quando algo parece nao resolvido. Abre a porta sem culpar nenhuma das pessoas.",
  "Close the loop": "Fechar o ciclo",
  "Use after a promise, repair, or plan so your partner does not have to guess whether follow-through happened.":
    "Use depois de uma promessa, reparo ou plano para sua parceria nao precisar adivinhar se houve continuidade.",
  "Practice, not theory": "Pratica, nao teoria",
  "Tiny things that help today": "Coisas pequenas que ajudam hoje",
  "These are deliberately small. The point is to make care easy to repeat.":
    "Elas sao pequenas de proposito. O ponto e tornar o cuidado facil de repetir.",
  "Repair chooser": "Escolhedor de reparo",
  "Pick the message that lowers the heat":
    "Escolha a mensagem que reduz a temperatura",
  "Send this draft": "Enviar este rascunho",
  "What happened?": "O que aconteceu?",
  "One sentence is enough.": "Uma frase e suficiente.",
  "Use when your partner needs to feel understood before you explain.":
    "Use quando sua parceria precisa se sentir entendida antes de voce explicar.",
  "Use when defensiveness is the main thing to repair.":
    "Use quando a defensividade e a principal coisa a reparar.",
  "Start softer": "Comecar mais suave",
  "Use before raising something hard so it starts as teamwork.":
    "Use antes de levantar algo dificil para comecar como trabalho em equipe.",
  "End safely": "Terminar com seguranca",
  "Use after a hard talk so nobody has to guess where things stand.":
    "Use depois de uma conversa dificil para ninguem precisar adivinhar como as coisas ficaram.",
  "what did you most need me to understand in that moment?":
    "o que voce mais precisava que eu entendesse naquele momento?",
  "What I heard": "O que eu ouvi",
  "What I own": "O que eu assumo",
  "Next step": "Proximo passo",
  "After repair": "Depois do reparo",
  "Keep the repair from evaporating": "Impedir que o reparo evapore",
  "A hard talk only helps if both people leave with something remembered, something owned, and one small follow-through.":
    "Uma conversa dificil so ajuda se os dois saem com algo lembrado, algo assumido e uma pequena continuidade.",
  "Send debrief": "Enviar debrief",
  "Check if landed": "Checar como chegou",
  "Make follow-through goal": "Criar meta de continuidade",
  "Not enough data": "Dados insuficientes",
  "Daily limit reached": "Limite diario atingido",
  "Weekly limit reached": "Limite semanal atingido",
  "Premium feature": "Recurso premium",
  "Keep the coach conversation going": "Manter a conversa com o orientador",
  "Free accounts include 3 coach messages per day. Premium removes that cap so support is available whenever a relationship moment is happening.":
    "Contas gratis incluem 3 mensagens ao orientador por dia. Premium remove esse limite para o apoio estar disponivel sempre que um momento do relacionamento acontecer.",
  "Unlimited coach conversations": "Conversas ilimitadas com o orientador",
  "Unlimited tone reviews and reply suggestions":
    "Revisoes de tom e sugestoes de resposta ilimitadas",
  "Advanced relationship insights": "Insights avancados do relacionamento",
  "Review every message before you send it":
    "Revisar cada mensagem antes de enviar",
  "Free accounts get 1 tone review per day. Premium keeps revision support available for every important message.":
    "Contas gratis recebem 1 revisao de tom por dia. Premium mantem apoio de revisao para cada mensagem importante.",
  "Unlimited tone reviews": "Revisoes de tom ilimitadas",
  "AI reply suggestions": "Sugestoes de resposta da IA",
  "Live mood analysis during chat":
    "Analise de humor ao vivo durante o chat",
  "Run analysis whenever your relationship needs a reset":
    "Rodar analise sempre que o relacionamento precisar de reinicio",
  "Free accounts include 1 full analysis each week. Premium unlocks unlimited re-analysis as conversations evolve.":
    "Contas gratis incluem 1 analise completa por semana. Premium libera reanalises ilimitadas conforme as conversas evoluem.",
  "Unlimited manual analysis": "Analises manuais ilimitadas",
  "Advanced insights tabs": "Abas de insights avancadas",
  "Persistent coaching context": "Contexto persistente de orientacao",
  "Premium can draft helpful responses in the tone your relationship needs right now.":
    "Premium pode rascunhar respostas uteis no tom que seu relacionamento precisa agora.",
  "Context-aware reply suggestions":
    "Sugestoes de resposta com contexto",
  "Live mood analysis": "Analise de humor ao vivo",
  "Unlimited coach support": "Apoio ilimitado do orientador",
  "See the emotional temperature in real time":
    "Ver a temperatura emocional em tempo real",
  "Premium monitors the live conversation so you can adjust before a message lands the wrong way.":
    "Premium monitora a conversa ao vivo para voce ajustar antes que uma mensagem chegue errado.",
  "Reply suggestions": "Sugestoes de resposta",
  "Advanced insights": "Insights avancados",
  "Customize your relationship profile":
    "Personalizar seu perfil de relacionamento",
  "Premium lets you override AI-detected patterns with the way you and your partner actually communicate.":
    "Premium permite substituir padroes detectados pela IA pelo jeito que voce e sua parceria realmente se comunicam.",
  "Edit profile signals manually": "Editar sinais do perfil manualmente",
  "Improve coaching accuracy": "Melhorar a precisao da orientacao",
  "Unlock advanced insights": "Liberar insights avancados",
  "Unlock premium access": "Liberar acesso premium",
  "Upgrade to Amore Premium to remove limits and unlock the full relationship support toolkit.":
    "Faca upgrade para Amore Premium para remover limites e liberar todo o kit de apoio ao relacionamento.",
  "Unlimited coach and AI tools": "Ferramentas ilimitadas de orientador e IA",
  "Editable relationship profile": "Perfil de relacionamento editavel",
  "Close upgrade modal": "Fechar modal de upgrade",
  "You have used": "Voce usou",
  "of": "de",
  "free uses for this window.": "usos gratis nesta janela.",
  "Free access resets on": "O acesso gratis reinicia em",
  "What did I notice and value this week?":
    "O que eu percebi e valorizei esta semana?",
  "Name the hard thing": "Nomear a coisa dificil",
  "What felt heavy, lonely, or unresolved?":
    "O que pareceu pesado, solitario ou nao resolvido?",
  "Ask for one need": "Pedir uma necessidade",
  "What would help me feel closer next week?":
    "O que me ajudaria a me sentir mais perto na proxima semana?",
  "Make one promise": "Fazer uma promessa",
  "What is small enough that we will actually do it?":
    "O que e pequeno o bastante para a gente realmente fazer?",
  "Weekly ritual": "Ritual semanal",
  "Personalized ritual": "Ritual personalizado",
  "10-minute repair window": "Janela de reparo de 10 minutos",
  "Start with one appreciation, own one part, and ask what would help the repair land.":
    "Comece com uma apreciacao, assuma uma parte e pergunte o que ajudaria o reparo a chegar bem.",
  "Your latest pattern suggests repair matters more than adding a new habit.":
    "Seu padrao mais recente sugere que reparar importa mais do que adicionar um novo habito.",
  "Same-question check-in": "Check-in com a mesma pergunta",
  "Both answer one gentle question, then compare only after both of you have answered.":
    "Os dois respondem uma pergunta gentil, depois comparam somente depois que ambos responderam.",
  "The current signal is to make emotional tracking mutual, not one-sided.":
    "O sinal atual e tornar o acompanhamento emocional mutuo, nao unilateral.",
  "Specific appreciation": "Apreciacao especifica",
  "Name one thing you noticed, what it showed you about your partner, and how it affected you.":
    "Nomeie uma coisa que voce percebeu, o que isso mostrou sobre sua parceria e como afetou voce.",
  "Things look stable enough to reinforce what is already working.":
    "As coisas parecem estaveis o bastante para reforcar o que ja esta funcionando.",
  "Pick one existing promise or goal and send a simple follow-through update.":
    "Escolha uma promessa ou meta existente e envie uma atualizacao simples de continuidade.",
  "An active goal is already in motion, so the useful ritual is follow-through.":
    "Uma meta ativa ja esta em andamento, entao o ritual util e dar continuidade.",
  "20-minute phone-free pocket": "Momento de 20 minutos sem celular",
  "Create one short protected pocket for a question, an appreciation, and no multitasking.":
    "Crie um momento curto e protegido para uma pergunta, uma apreciacao e nenhuma multitarefa.",
  "The useful move is a lightweight shared moment, not a larger relationship project.":
    "O movimento util e um momento compartilhado leve, nao um projeto maior de relacionamento.",
  "Rotates with cooldown so the same practice does not keep repeating.":
    "Alterna com intervalo para que a mesma pratica nao fique se repetindo.",
  "Coach me through it": "Me orientar nisso",
  "Draft invite": "Rascunhar convite",
  "Weekly relationship report": "Relatorio semanal do relacionamento",
  "Generate this week when you are ready":
    "Gere esta semana quando estiver pronto",
  "Creates a shared couple summary from recent check-ins, goals, message activity, and the current ritual. It stays directional when data is thin.":
    "Cria um resumo compartilhado do casal a partir de check-ins recentes, metas, atividade de mensagens e o ritual atual. Ele permanece direcional quando ha poucos dados.",
  "Generate weekly report": "Gerar relatorio semanal",
  "Regenerate report": "Gerar relatorio novamente",
  "Shared couple report": "Relatorio compartilhado do casal",
  "Private coach follow-up": "Acompanhamento privado com o orientador",
  "Use this privately before sharing anything. Partner-visible summaries still require your explicit action.":
    "Use isto em privado antes de compartilhar qualquer coisa. Resumos visiveis para a parceria ainda exigem sua acao explicita.",
  "Reflect privately": "Refletir em privado",
  "Recent history": "Historico recente",
  "The 15-minute relationship reset":
    "O reinicio do relacionamento em 15 minutos",
  "The app should help you build a relationship habit, not just inspect data. Do this once a week when things are calm.":
    "O app deve ajudar voces a construir um habito de relacionamento, nao apenas inspecionar dados. Facam isso uma vez por semana quando tudo estiver calmo.",
  "Send reset summary": "Enviar resumo do reinicio",
  "Ask for need": "Pedir necessidade",
  "Make promise a goal": "Transformar promessa em meta",
  "Write a sentence you can share...":
    "Escreva uma frase que voce pode compartilhar...",
  "A tiny relationship practice for this week.":
    "Uma pequena pratica de relacionamento para esta semana.",
  "Connect WhatsApp First": "Conecte o WhatsApp primeiro",
  "Link your WhatsApp account to start chatting with your partner.":
    "Vincule sua conta do WhatsApp para comecar a conversar com sua parceria.",
  "You are connected with": "Voce esta conectado com",
  "Go to Dashboard": "Ir para o painel",
  "Connect with your partner": "Conectar com sua parceria",
  "Send a connection request to start using Amore together.":
    "Envie um pedido de conexao para comecar a usar o Amore juntos.",
  "Invite your partner": "Convidar sua parceria",
  "Enter their email address. They'll need an Amore account to accept.":
    "Digite o email da pessoa. Ela precisara de uma conta Amore para aceitar.",
  "Sent invitations": "Convites enviados",
  "Welcome to Amore": "Boas-vindas ao Amore",
  "Get started by talking to your coach or uploading a conversation for instant insights.":
    "Comece conversando com o orientador ou enviando uma conversa para receber insights instantaneos.",
  "Talk to your relationship coach":
    "Conversar com seu orientador de relacionamento",
  "Get personalized guidance on communication, conflict resolution, and relationship growth. No partner connection required.":
    "Receba orientacao personalizada sobre comunicacao, resolucao de conflitos e crescimento do relacionamento. Nao e preciso conectar uma parceria.",
  "Export a conversation from WhatsApp and get a health score and relationship insights in under a minute.":
    "Exporte uma conversa do WhatsApp e receba uma pontuacao de saude e insights do relacionamento em menos de um minuto.",
  "Invite your partner to unlock live insights, shared goals, rituals, and mood sync.":
    "Convide sua parceria para liberar insights ao vivo, metas compartilhadas, rituais e sincronizacao de humor.",
  "Your partner only sees what you explicitly share after they accept.":
    "Sua parceria so ve o que voce compartilha explicitamente depois de aceitar.",
  "Your private import preview and private coach history are not shared by default. Inviting your partner unlocks shared tools; it does not expose private solo work unless you explicitly choose to share it.":
    "Sua pre-visualizacao privada de importacao e seu historico privado com o orientador nao sao compartilhados por padrao. Convidar sua parceria libera ferramentas compartilhadas; isso nao expoe trabalho privado solo a menos que voce escolha compartilhar explicitamente.",
  "Live insights from both sides": "Insights ao vivo dos dois lados",
  "Shared goals and follow-through": "Metas compartilhadas e acompanhamento",
  "Rituals you can both complete": "Rituais que voces dois podem concluir",
  "Mood sync without guessing": "Sincronizacao de humor sem adivinhar",
  "Invite your partner to unlock live WhatsApp analysis, shared goals, and mood tracking.":
    "Convide sua parceria para liberar analise ao vivo do WhatsApp, metas compartilhadas e acompanhamento de humor.",
  "Need your partner to know how you are right now?":
    "Sua parceria precisa saber como voce esta agora?",
  "Use a quick mood only when today changes. Your daily check-in already updates your shared mood.":
    "Use um humor rapido apenas quando o dia mudar. Seu check-in diario ja atualiza o humor compartilhado.",
  "Premium checkout completed. If your upgraded access has not appeared yet, give the billing webhook a moment and refresh.":
    "Checkout premium concluido. Se o acesso atualizado ainda nao apareceu, aguarde um momento pelo webhook de cobranca e atualize.",
  "One appreciation message every day":
    "Uma mensagem de apreciacao todos os dias",
  "Send one specific appreciation each day. Keep it concrete: what you noticed, why it mattered, and how it made you feel.":
    "Envie uma apreciacao especifica por dia. Mantenha concreta: o que voce percebeu, por que importou e como fez voce se sentir.",
  "One phone-free conversation this week":
    "Uma conversa sem celular esta semana",
  "Pick one 20-minute window with no phones, no fixing, and no multitasking. Just ask what felt good and what felt hard.":
    "Escolha uma janela de 20 minutos sem celulares, sem consertar e sem multitarefa. Apenas pergunte o que foi bom e o que foi dificil.",
  "When something feels unresolved, start with appreciation, own one part, and ask to understand before defending.":
    "Quando algo parecer nao resolvido, comece com apreciacao, assuma uma parte e pergunte para entender antes de se defender.",
  "One care swap this week": "Uma troca de cuidado esta semana",
  "Each person names one small practical support request and one support offer so care becomes explicit instead of guessed.":
    "Cada pessoa nomeia um pequeno pedido pratico de apoio e uma oferta de apoio para o cuidado ficar explicito em vez de adivinhado.",
  "One apology with changed behavior":
    "Um pedido de desculpas com mudanca de comportamento",
  "Own one specific impact, name the behavior that will change, and ask whether the repair would actually land.":
    "Assuma um impacto especifico, nomeie o comportamento que vai mudar e pergunte se o reparo realmente chegaria bem.",
  "Connect with your partner to set shared goals.":
    "Conecte-se com sua parceria para definir metas compartilhadas.",
  "Connect now": "Conectar agora",
  "Start tiny": "Comecar pequeno",
  "Goal completed": "Meta concluida",
  "Celebrate what worked before moving on":
    "Celebrar o que funcionou antes de seguir em frente",
  "You completed": "Voce concluiu",
  ". Turn it into one moment of appreciation and learning together.":
    ". Transforme isso em um momento de apreciacao e aprendizado juntos.",
  "Celebrate in chat": "Celebrar no chat",
  "Thinking...": "Pensando...",
  "New Goal": "Nova meta",
  "e.g. Weekly date night": "ex.: encontro semanal",
  "(optional)": "(opcional)",
  "What does this goal look like?": "Como esta meta se parece?",
  "Due Date": "Data limite",
  "AI Suggestions": "Sugestoes da IA",
  "Dismiss goal": "Dispensar meta",
  "No active goals yet. Add one above or get AI suggestions.":
    "Ainda nao ha metas ativas. Adicione uma acima ou receba sugestoes da IA.",
  "Completed (": "Concluidas (",
  "Connect with your partner to unlock detailed relationship insights, communication analytics, and AI-powered coaching.":
    "Conecte-se com sua parceria para liberar insights detalhados do relacionamento, analises de comunicacao e orientacao com IA.",
  "Relationship support that grows with the conversation":
    "Apoio ao relacionamento que cresce com a conversa",
  "Start free for daily guidance. Upgrade when you want unlimited coaching, richer insights, and the tools that help hard moments land better.":
    "Comece gratis com orientacao diaria. Faca upgrade quando quiser orientacao ilimitada, insights mais ricos e ferramentas que ajudam momentos dificeis a chegarem melhor.",
  "Your access": "Seu acesso",
  "Your Stripe subscription is": "Sua assinatura Stripe esta",
  "Your couple already has premium access through your partner's subscription.":
    "Seu casal ja tem acesso premium pela assinatura da sua parceria.",
  "Upgrade to remove daily and weekly limits as your relationship support needs grow.":
    "Faca upgrade para remover limites diarios e semanais conforme suas necessidades de apoio crescem.",
  "Premium is already unlocked for your couple. Billing is managed from the subscriber's account.":
    "Premium ja esta liberado para seu casal. A cobranca e gerenciada pela conta assinante.",
  "Back to dashboard": "Voltar ao painel",
  "Compare plans": "Comparar planos",
  "Premium removes the friction once Amore becomes part of your day-to-day rhythm.":
    "Premium remove o atrito quando o Amore passa a fazer parte do ritmo diario.",
  "Prefers clear, straightforward communication":
    "Prefere comunicacao clara e direta",
  "Leads with empathy and emotional validation":
    "Comeca com empatia e validacao emocional",
  "Processes through logic and structured thinking":
    "Processa por logica e pensamento estruturado",
  "Communicates with energy, emotion, and storytelling":
    "Comunica com energia, emocao e narrativa",
  "AI detected": "Detectado pela IA",
  "data yet. Edit your profile or run an AI analysis.":
    "ainda. Edite o perfil ou rode uma analise de IA.",
  "Care manual": "Manual de cuidado",
  "Stop guessing what helps when one of you is hurt":
    "Pare de adivinhar o que ajuda quando um de voces esta machucado",
  "Ask for the practical instructions before the next hard moment: what support lands, how to pause without disappearing, what repair helps, and what to avoid.":
    "Peca instrucoes praticas antes do proximo momento dificil: qual apoio chega bem, como pausar sem desaparecer, qual reparo ajuda e o que evitar.",
  "Ask stress signs": "Perguntar sinais de estresse",
  "Repair miss": "Reparar falha",
  "Share mine first": "Compartilhar o meu primeiro",
  "Profile bridge": "Ponte dos perfis",
  "Turn both profiles into one small adjustment":
    "Transformar os dois perfis em um pequeno ajuste",
  "Use this when the profile data is interesting but you need it to become a real habit: one care adjustment and one conversation adjustment for this week.":
    "Use quando os dados do perfil sao interessantes, mas precisam virar habito real: um ajuste de cuidado e um ajuste de conversa para esta semana.",
  "Bridge in chat": "Fazer ponte no chat",
  "Connect with your partner to build your relationship profile.":
    "Conecte-se com sua parceria para construir o perfil do relacionamento.",
  "Select...": "Selecionar...",
  None: "Nenhum",
  Primary: "Principal",
  Secondary: "Secundario",
  "Primary:": "Primario:",
  "Secondary:": "Secundario:",
  "Describe your communication style...":
    "Descreva seu estilo de comunicacao...",
  "(comma-separated)": "(separados por virgula)",
  "e.g. Cooking, Hiking, Movies, Music":
    "ex.: Cozinhar, trilhas, filmes, musica",
  "'s Profile": ": perfil",
  "Ask what helps": "Perguntar o que ajuda",
  "hasn't set up their profile yet.": "ainda nao configurou o perfil.",
  "Let's get you set up. How would you like to be called?":
    "Vamos configurar sua conta. Como voce gostaria de ser chamado?",
  "Display Name": "Nome de exibicao",
  "Your name": "Seu nome",
  "Accepts .txt or .zip WhatsApp exports (max 5MB)":
    "Aceita exportacoes .txt ou .zip do WhatsApp (max. 5 MB)",
  "Which one is you?": "Qual deles e voce?",
  "We found": "Encontramos",
  "messages between two people. Select your name so we can analyze the conversation correctly.":
    "mensagens entre duas pessoas. Selecione seu nome para analisarmos a conversa corretamente.",
  "Choose a different file": "Escolher outro arquivo",
  "messages found. For better insights, upload a conversation with at least 50 messages.":
    "mensagens encontradas. Para melhores insights, envie uma conversa com pelo menos 50 mensagens.",
  "Analyze conversation": "Analisar conversa",
  "Analyzing your conversation": "Analisando sua conversa",
  "This usually takes 30-60 seconds. We're looking at communication patterns, sentiment, and relationship dynamics.":
    "Isso geralmente leva 30-60 segundos. Estamos olhando padroes de comunicacao, sentimento e dinamicas do relacionamento.",
  "Your relationship health score": "Sua pontuacao de saude do relacionamento",
  "Based on": "Com base em",
  "messages analyzed": "mensagens analisadas",
  "Upload another conversation": "Enviar outra conversa",
  "How to export a WhatsApp chat": "Como exportar uma conversa do WhatsApp",
  "Open the conversation in WhatsApp": "Abra a conversa no WhatsApp",
  "Tap the three dots (or contact name) at the top":
    "Toque nos tres pontos (ou no nome do contato) no topo",
  'Select "Export chat" and choose "Without Media"':
    'Selecione "Exportar conversa" e escolha "Sem midia"',
  "Save the .txt file and upload it here": "Salve o arquivo .txt e envie aqui",
  "WhatsApp Integration": "Integracao com WhatsApp",
  "Connect your WhatsApp to sync messages with Amore. Scan the QR code with your phone to pair.":
    "Conecte seu WhatsApp para sincronizar mensagens com o Amore. Escaneie o QR code com o celular para parear.",
  "WhatsApp QR Code": "QR code do WhatsApp",
  "Open WhatsApp on your phone, go to": "Abra o WhatsApp no celular, va em",
  "Settings > Linked Devices": "Configuracoes > Dispositivos conectados",
  ", and scan this code.": ", e escaneie este codigo.",
  "Waiting for QR code from bridge...": "Aguardando QR code da bridge...",
  "Select your partner's contact": "Selecione o contato da sua parceria",
  "Choose which WhatsApp contact is your partner so Amore can sync your conversations.":
    "Escolha qual contato do WhatsApp e sua parceria para o Amore sincronizar as conversas.",
  "Search contacts...": "Buscar contatos...",
  "Saving selection...": "Salvando selecao...",
  "No contacts match your search.": "Nenhum contato corresponde a busca.",
  "No contacts found.": "Nenhum contato encontrado.",
  "WhatsApp is connected and syncing messages.":
    "WhatsApp conectado e sincronizando mensagens.",
  "Go to Chat": "Ir para o chat",
  "Change Partner": "Alterar parceria",
  Click: "Clique em",
  "to start a new session.": "para iniciar uma nova sessao.",
  "Scan the QR code with your phone (WhatsApp > Settings > Linked Devices > Link a Device).":
    "Escaneie o QR code com o celular (WhatsApp > Configuracoes > Dispositivos conectados > Conectar um dispositivo).",
  "Select your partner's contact from the synced contact list.":
    "Selecione o contato da sua parceria na lista de contatos sincronizados.",
  "Once connected, Amore will sync your messages and provide relationship insights on the dashboard.":
    "Depois de conectado, o Amore sincronizara suas mensagens e mostrara insights do relacionamento no painel.",
  "Your messages are encrypted and processed securely. Only aggregated insights are stored.":
    "Suas mensagens sao criptografadas e processadas com seguranca. Apenas insights agregados sao armazenados.",
  "Create Account": "Criar conta",
  "Stripe is not configured. Set STRIPE_SECRET_KEY.":
    "Stripe nao esta configurado. Defina STRIPE_SECRET_KEY.",
  "Stripe is not configured. Set STRIPE_PRICE_ID.":
    "Stripe nao esta configurado. Defina STRIPE_PRICE_ID.",
  "Premium is already active for this account.":
    "Premium ja esta ativo para esta conta.",
  "Stripe checkout session did not include a redirect URL.":
    "A sessao de checkout do Stripe nao incluiu URL de redirecionamento.",
  "No Stripe customer found for this account.":
    "Nenhum cliente Stripe encontrado para esta conta.",
  "No messages found in the file. Please check the format.":
    "Nenhuma mensagem encontrada no arquivo. Verifique o formato.",
  "Could not detect two conversation participants. Please upload a 1-on-1 chat export.":
    "Nao foi possivel detectar dois participantes. Envie uma exportacao de conversa 1:1.",
  "Thread not found": "Conversa nao encontrada",
  "Mood state not found": "Estado de humor nao encontrado",
  "Unauthorized": "Nao autorizado",
  "You cannot send a connection request to yourself":
    "Voce nao pode enviar um pedido de conexao para si mesmo",
  "If this email is registered, a connection request has been sent.":
    "Se este email estiver registrado, um pedido de conexao foi enviado.",
  "You are already connected with this person":
    "Voce ja esta conectado com esta pessoa",
  "Connection request not found": "Pedido de conexao nao encontrado",
  "Goal not found": "Meta nao encontrada",
  "Mood detection not found": "Deteccao de humor nao encontrada",
  "Mood detection already resolved": "Deteccao de humor ja resolvida",
  "Not your mood detection": "Esta deteccao de humor nao e sua",
  "No active couple found": "Nenhum casal ativo encontrado",
  "Not found": "Nao encontrado",
  "ANTHROPIC_API_KEY environment variable is required":
    "A variavel de ambiente ANTHROPIC_API_KEY e obrigatoria",
  "Send one warm check-in, offer one concrete support option they can accept or decline, and check back later without making silence mean everything is fine.":
    "Envie um check-in acolhedor, ofereca uma opcao concreta de apoio que a pessoa possa aceitar ou recusar, e volte depois sem tratar o silencio como se estivesse tudo bem.",
  Show: "Mostrar",
  Hide: "Ocultar",
  "Check in": "Checar",
  Repair: "Reparar",
  Need: "Necessidade",
  "Own my part": "Assumir minha parte",
  "Break silence": "Quebrar silencio",
  "No reply": "Sem resposta",
  "Respect no": "Respeitar o nao",
  "Redo message": "Refazer mensagem",
  "Before advice": "Antes do conselho",
  "After yes": "Depois do sim",
  "Both true": "Duas verdades",
  "Repair guide": "Guia de reparo",
  Write: "Escrever",
  Improve: "Melhorar",
  Guide: "Guias",
  "Need guide": "Guia de necessidade",
  "Appreciation guide": "Guia de apreciacao",
  "Apology guide": "Guia de pedido de desculpas",
  "Conflict map": "Mapa do conflito",
  "Space request": "Pedido de espaco",
  "Space guide": "Guia de espaco",
  "Missed bid": "Tentativa perdida",
  "Aftercare plan": "Plano de cuidado posterior",
  "Listen first": "Ouvir primeiro",
  "Voice message": "Mensagem de voz",
  "Audio unavailable": "Audio indisponivel",
  "Play voice message": "Reproduzir mensagem de voz",
  "Pause voice message": "Pausar mensagem de voz",
  Longing: "Desejo por tras",
  "Longing request": "Pedido por tras da queixa",
  "Local draft check": "Checagem local do rascunho",
  "Ready to send": "Pronto para enviar",
  "Make ready": "Deixar pronto",
  "Add moment": "Adicionar momento",
  "Add clear ask": "Adicionar pedido claro",
  "Add ownership": "Adicionar responsabilidade",
  "Add warmth": "Adicionar acolhimento",
  "Add choice": "Adicionar escolha",
  "Specific moment": "Momento especifico",
  "Clear next ask": "Proximo pedido claro",
  "No global blame": "Sem culpa generalizada",
  "Warmth signal": "Sinal de acolhimento",
  "Room for no": "Espaco para nao",
  OK: "OK",
  Needs: "Precisa",
  "Fix before send": "Corrigir antes de enviar",
  Send: "Enviar",
  Soften: "Suavizar",
  Pause: "Pausar",
  "Follow up": "Acompanhar",
  Aftercare: "Cuidado depois",
  Goal: "Meta",
  Review: "Revisar",
  "Type a message...": "Digite uma mensagem...",
  "Rewrite this into a softer start": "Reescrever com um comeco mais suave",
  "Turn this into a 20-minute pause request":
    "Transformar em um pedido de pausa de 20 minutos",
  "Prepare a follow-up that checks how this landed":
    "Preparar um acompanhamento para checar como isso chegou",
  "Turn this into a small aftercare plan":
    "Transformar em um pequeno plano de cuidado posterior",
  "Ask coach to improve this draft":
    "Pedir ao orientador para melhorar este rascunho",
  "Turn this draft into a tiny goal":
    "Transformar este rascunho em uma meta pequena",
  "Review tone with AI": "Revisar tom com IA",
  "Failed to load reply suggestions": "Falha ao carregar sugestoes de resposta",
  "Failed to analyze mood": "Falha ao analisar humor",
  "Failed to review message": "Falha ao revisar mensagem",
  "Review limit reached. Try again in a few minutes.":
    "Limite de revisoes atingido. Tente novamente em alguns minutos.",
  "Failed to open coach thread": "Falha ao abrir a conversa com o orientador",
  "Failed to connect to coach": "Falha ao conectar ao orientador",
  "Coach response stream unavailable":
    "Fluxo de resposta do orientador indisponivel",
  "Coach request failed": "Pedido ao orientador falhou",
  "Coach response timed out. Please try again.":
    "A resposta do orientador demorou demais. Tente novamente.",
  "AI Assistant": "Assistente de IA",
  "Relationship Health": "Saude do relacionamento",
  "Conversation Toolkit": "Kit de conversa",
  "Partner Interests": "Interesses da parceria",
  "Plan care in chat": "Planejar cuidado no chat",
  "Draft repair check-in": "Rascunhar check-in de reparo",
  "Unlock AI reply suggestions": "Liberar sugestoes de resposta da IA",
  "See premium plans": "Ver planos premium",
  "Maybe later": "Talvez depois",
  "The space between you, understood.": "O espaco entre voces, compreendido.",
  "How it works": "Como funciona",
  Grow: "Crescer",
  "Your conversations stay private. Only insights are stored.":
    "Suas conversas continuam privadas. Apenas insights sao armazenados.",
  "Link your WhatsApp conversations securely. Setup takes less than a minute.":
    "Conecte suas conversas do WhatsApp com seguranca. A configuracao leva menos de um minuto.",
  "AI surfaces patterns in how you communicate — tone, topics, and timing.":
    "A IA revela padroes de como voces se comunicam: tom, assuntos e timing.",
  "Get personalized coaching to strengthen your connection, day by day.":
    "Receba orientacao personalizada para fortalecer a conexao dia apos dia.",
  "Waiting for your partner...": "Aguardando sua parceria...",
  day: "dia",
  Health: "Saude",
  "Room for growth": "Espaco para crescer",
  "Needs attention": "Precisa de atencao",
  "Your relationship is thriving": "O relacionamento de voces esta florescendo",
  "Analyzing your messages…": "Analisando suas mensagens...",
  "Analyzing your relationship…": "Analisando o relacionamento...",
  "Connect WhatsApp to get your score":
    "Conecte o WhatsApp para ver sua pontuacao",
  Great: "Otimo",
  Good: "Bom",
  Neutral: "Neutro",
  Low: "Baixo",
  "DRAFT PREVIEW": "PREVIA DO RASCUNHO",
  "CARE PLAN": "PLANO DE CUIDADO",
  "QUESTION OF THE DAY": "PERGUNTA DO DIA",
  "MICRO-DATE": "MICROENCONTRO",
  "MICRO-DATE · 30 MINUTES": "MICROENCONTRO · 30 MINUTOS",
  "AFTER REPAIR": "DEPOIS DO REPARO",
  "BEFORE CONFLICT": "ANTES DO CONFLITO",
  "PRACTICE, NOT THEORY": "PRATICA, NAO TEORIA",
  "Draft appreciation": "Rascunhar apreciacao",
  "Draft check-in": "Rascunhar check-in",
  "Draft repair": "Rascunhar reparo",
  "Draft follow-through": "Rascunhar acompanhamento",
  "Share a quick mood": "Compartilhar humor rapido",
  Reset: "Reiniciar",
  "Start repair guide": "Abrir guia de reparo",
  "Hide guide": "Ocultar guia",
  "Hide quick mood": "Ocultar humor rapido",
  Manage: "Gerenciar",
  Balance: "Equilibrio",
  you: "voce",
  partner: "parceria",
  Balanced: "Equilibrado",
  "You initiate more": "Voce inicia mais",
  "Partner initiates more": "A parceria inicia mais",
  Discuss: "Conversar",
  "/day": "/dia",
  Due: "Vence",
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (text: string) => string;
  localeLabel: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function normalizeLocale(value: unknown): Locale {
  if (
    value === "pt-BR" ||
    value === "pt_BR" ||
    value === "pt" ||
    value === "pt-br"
  )
    return "pt-BR";
  return "en";
}

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return normalizeLocale(stored);
  return normalizeLocale(window.navigator.language);
}

export function translateText(text: string, locale: Locale): string {
  if (locale === "en") return text;
  return PT_BR_COPY[text.trim()] ?? text;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const nextLocale = getStoredLocale();
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  useDomTranslations(locale);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (text) => translateText(text, locale),
      localeLabel: LOCALE_LABELS[locale],
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    const locale = getStoredLocale();
    return {
      locale,
      setLocale: () => {},
      t: (text: string) => translateText(text, locale),
      localeLabel: LOCALE_LABELS[locale],
    } satisfies I18nContextValue;
  }
  return value;
}

export function GlobalLanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="fixed right-3 top-3 z-[60] flex rounded-full border border-warm-200/60 bg-warm-50/70 px-1 py-0.5 opacity-70 shadow-[0_1px_3px_rgba(42,33,24,0.04)] backdrop-blur transition-opacity hover:opacity-100">
      {(["en", "pt-BR"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
            locale === option
              ? "text-warm-900"
              : "text-warm-400 hover:text-warm-700"
          }`}
          aria-pressed={locale === option}
          aria-label={option === "en" ? "English" : "Portugues"}
        >
          {option === "en" ? "EN" : "PT"}
        </button>
      ))}
    </div>
  );
}

function useDomTranslations(locale: Locale) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const translateTextNode = (node: Text) => {
      const current = node.nodeValue ?? "";
      const state = ORIGINAL_TEXT_NODES.get(node);
      const original =
        state && current === state.lastApplied ? state.original : current;
      const leading = original.match(/^\s*/)?.[0] ?? "";
      const trailing = original.match(/\s*$/)?.[0] ?? "";
      const trimmed = original.trim();
      if (!trimmed) return;
      const translated = translateText(trimmed, locale);
      const nextValue = `${leading}${translated}${trailing}`;
      ORIGINAL_TEXT_NODES.set(node, { original, lastApplied: nextValue });
      if (node.nodeValue !== nextValue) {
        node.nodeValue = nextValue;
      }
    };

    const translateElement = (element: Element) => {
      for (const attr of ["placeholder", "title", "aria-label"]) {
        let attrs = ORIGINAL_ELEMENT_ATTRS.get(element);
        if (!attrs) {
          attrs = new Map<string, string>();
          ORIGINAL_ELEMENT_ATTRS.set(element, attrs);
        }
        const original = attrs.get(attr) ?? element.getAttribute(attr);
        if (!original) continue;
        if (!attrs.has(attr)) {
          attrs.set(attr, original);
        }
        const translated = translateText(original, locale);
        if (element.getAttribute(attr) !== translated) {
          element.setAttribute(attr, translated);
        }
      }
    };

    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root as Text);
        return;
      }
      if (!(root instanceof Element)) return;
      if (["SCRIPT", "STYLE", "TEXTAREA"].includes(root.tagName)) return;

      translateElement(root);
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      );
      let current = walker.nextNode();
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
          translateTextNode(current as Text);
        } else if (current instanceof Element) {
          if (["SCRIPT", "STYLE", "TEXTAREA"].includes(current.tagName)) {
            current = walker.nextSibling();
            continue;
          }
          translateElement(current);
        }
        current = walker.nextNode();
      }
    };

    walk(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) walk(node);
        if (mutation.type === "characterData") walk(mutation.target);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [locale]);
}
