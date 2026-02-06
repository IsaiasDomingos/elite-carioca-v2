import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Tv,
  Camera,
  Lock,
  ArrowLeft,
  Home,
  Bell,
  LogOut,
  Save,
  ChevronRight,
  Scissors,
  Crown,
  Trash2,
  Clock,
  Users,
  Scan,
  Eraser,
  Settings,
  UserCheck,
  UserMinus,
  UserX,
  RefreshCw,
  CheckCircle2,
  Play,
  Calendar,
  AlertTriangle,
  X,
  ShieldAlert,
  Zap,
  Loader2,
  Code2,
  Circle,
  Check,
  Info,
  AlertCircle,
  DollarSign,
  Banknote,
  CreditCard,
  TrendingUp,
} from "lucide-react";

// Utilizando a camada de compatibilidade do Firebase
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
  apiKey: "process.env.FIREBASE_API_KEY",
  authDomain: "sistema-barbearia-acb02.firebaseapp.com",
  projectId: "sistema-barbearia-acb02",
  storageBucket: "sistema-barbearia-acb02.firebasestorage.app",
  messagingSenderId: "958055433116",
  appId: "1:958055433116:web:485e9f85f8386121852002",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// COMPONENTE: GlassContainer
const GlassContainer = ({ children, className = "", onClick }: any) => {
  const m = motion as any;
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={onClick ? { scale: 1.01 } : {}}
      onClick={onClick}
      className={`glass rounded-[2.5rem] p-8 transition-all ${className}`}
    >
      {children}
    </m.div>
  );
};

// COMPONENTE: Assinatura
const ISDSignature = () => (
  <div className="fixed bottom-6 left-0 right-0 flex justify-center items-center pointer-events-none z-50">
    <div className="flex items-center gap-2 isd-signature text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
      <Code2 size={12} className="text-blue-500" />
      Developed by <span className="text-blue-400">&lt;ISD Systems /&gt;</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const m = motion as any;

  // Estados de Visualização
  const [modo, setModo] = useState<
    | "selecao"
    | "cliente_registro"
    | "painel"
    | "biometria"
    | "barbeiro_choice"
    | "gestao_master"
    | "admin_barbeiro"
  >("selecao");

  // Estados de Dados
  const [clientesFila, setClientesFila] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [historicoAtendimentos, setHistoricoAtendimentos] = useState<any[]>([]);
  const [barbeiroLogado, setBarbeiroLogado] = useState<any | null>(null);

  // Estados Financeiros e Modais
  const [checkoutAtivo, setCheckoutAtivo] = useState<any | null>(null);
  const [valorInput, setValorInput] = useState<string>("50.00");
  const [showGanhosModal, setShowGanhosModal] = useState(false);

  // Estados de Notificação (Toasts)
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (
    message: string,
    type: "sucesso" | "erro" | "info" = "info"
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Estados de Segurança e Bloqueio
  const [tentativasPIN, setTentativasPIN] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  // Estados de Cadastro e Input
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    sobrenome: "",
    whatsapp: "",
    cpf: "",
    foto: "",
    barbeiroPref: "Sem Preferência",
    servico: "Cabelo",
  });
  const [novoProf, setNovoProf] = useState({ nome: "", matricula: "" });
  const [acessoInput, setAcessoInput] = useState("");
  const [flash, setFlash] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevClientesRef = useRef<any[]>([]);

  // Formatação de Dinheiro
  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  // Carregar Som
  useEffect(() => {
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    );
  }, []);

  // --- EFEITOS DE CARREGAMENTO ---
  useEffect(() => {
    const unsubFila = db
      .collection("fila_paiva")
      .orderBy("chegada", "asc")
      .onSnapshot((snap) => {
        const novosClientes = snap.docs.map((d: any) => ({
          id: d.id,
          ...d.data(),
        }));

        if (modo === "painel") {
          const clienteChamado = novosClientes.find((c) => {
            const anterior = prevClientesRef.current.find((p) => p.id === c.id);
            return (
              c.status === "atendendo" &&
              (!anterior || anterior.status === "esperando")
            );
          });

          if (clienteChamado) {
            audioRef.current
              ?.play()
              .catch(() => console.log("Áudio bloqueado pelo navegador"));
          }
        }

        prevClientesRef.current = novosClientes;
        setClientesFila(novosClientes);
      });

    const unsubProf = db.collection("profissionais").onSnapshot((snap) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setProfissionais(list);
      if (barbeiroLogado) {
        const atual = list.find((p) => p.id === barbeiroLogado.id);
        if (atual) setBarbeiroLogado(atual);
      }
    });

    const unsubHist = db
      .collection("historico_paiva")
      .orderBy("dataConclusao", "desc")
      .limit(100) // Aumentado para o dashboard financeiro ter dados suficientes
      .onSnapshot((snap) => {
        setHistoricoAtendimentos(
          snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
        );
      });

    return () => {
      unsubFila();
      unsubProf();
      unsubHist();
      pararCamera();
    };
  }, [barbeiroLogado?.id, modo]);

  // Efeito da câmera
  useEffect(() => {
    if (modo === "biometria") {
      abrirCamera();
    } else if (modo === "selecao") {
      pararCamera();
    }
  }, [modo]);

  // Timer de Bloqueio de Segurança
  useEffect(() => {
    let interval: any;
    if (bloqueadoAte) {
      interval = setInterval(() => {
        const rest = Math.ceil((bloqueadoAte - Date.now()) / 1000);
        if (rest <= 0) {
          setBloqueadoAte(null);
          setTentativasPIN(0);
          setSegundosRestantes(0);
          addToast("Sistema liberado para novas tentativas.", "info");
        } else {
          setSegundosRestantes(rest);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bloqueadoAte]);

  // --- FUNÇÕES DE HARDWARE ---
  const abrirCamera = async () => {
    try {
      pararCamera();
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err: any) {
      addToast("Erro ao acessar hardware de vídeo.", "erro");
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const tirarFoto = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, 400, 400);
      const dataUrl = canvasRef.current.toDataURL("image/png");
      setNovoCliente((prev) => ({ ...prev, foto: dataUrl }));
      pararCamera();
      setModo("cliente_registro");
      addToast("Biometria capturada com sucesso.", "sucesso");
    }
  };

  // --- LOGICA DE ACESSO ---
  const handleAcessoUnificado = () => {
    if (bloqueadoAte) return;

    if (acessoInput === "123456") {
      setModo("gestao_master");
      setAcessoInput("");
      setTentativasPIN(0);
      addToast("Modo Master ativado.", "sucesso");
      return;
    }

    const prof = profissionais.find((p) => p.matricula === acessoInput);
    if (prof) {
      setBarbeiroLogado(prof);
      setModo("admin_barbeiro");
      setAcessoInput("");
      setTentativasPIN(0);
      addToast(`Bem-vindo, ${prof.nome}.`, "sucesso");
    } else {
      const nextAttempt = tentativasPIN + 1;
      setTentativasPIN(nextAttempt);
      setAcessoInput("");

      if (nextAttempt >= 3) {
        setBloqueadoAte(Date.now() + 300000); // 5 min
        addToast(
          "Acesso bloqueado por 5 minutos devido a múltiplas falhas.",
          "erro"
        );
      } else {
        addToast(
          `Acesso negado. Restam ${3 - nextAttempt} tentativas.`,
          "erro"
        );
      }
    }
  };

  const mudarStatus = async (
    novoStatus: "disponivel" | "ocupado" | "ausente"
  ) => {
    if (!barbeiroLogado) return;
    setLoadingAction("status");
    try {
      const batch = db.batch();
      const profRef = db.collection("profissionais").doc(barbeiroLogado.id);
      batch.update(profRef, { status: novoStatus });
      if (novoStatus === "ausente") {
        clientesFila
          .filter(
            (c) =>
              c.barbeiroPref === barbeiroLogado.nome && c.status === "esperando"
          )
          .forEach((c) =>
            batch.update(db.collection("fila_paiva").doc(c.id), {
              barbeiroPref: "Sem Preferência",
            })
          );
      }
      await batch.commit();
      addToast(`Status: ${novoStatus.toUpperCase()}`, "info");
    } catch (e) {
      addToast("Falha ao atualizar status.", "erro");
    } finally {
      setLoadingAction(null);
    }
  };

  const cadastrarCliente = async (barbeiro: string) => {
    try {
      await db.collection("fila_paiva").add({
        ...novoCliente,
        barbeiroPref: barbeiro,
        chegada: firebase.firestore.Timestamp.now(),
        status: "esperando",
      });
      setModo("selecao");
      setNovoCliente({
        nome: "",
        sobrenome: "",
        whatsapp: "",
        cpf: "",
        foto: "",
        barbeiroPref: "Sem Preferência",
        servico: "Cabelo",
      });
      addToast("Cadastro concluído com sucesso.", "sucesso");
    } catch (e) {
      addToast("Falha no cadastro.", "erro");
    }
  };

  const confirmarFinalizacao = async () => {
    if (!checkoutAtivo) return;
    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor <= 0) return addToast("Valor inválido.", "erro");

    setLoadingAction(checkoutAtivo.id);
    try {
      await db.collection("historico_paiva").add({
        nome: checkoutAtivo.nome + " " + (checkoutAtivo.sobrenome || ""),
        barbeiro: barbeiroLogado.nome,
        servico: checkoutAtivo.servico || "Cabelo",
        valor: valor,
        dataConclusao: firebase.firestore.Timestamp.now(),
        tempoEspera: Math.floor(
          (Date.now() - checkoutAtivo.chegada.toMillis()) / 60000
        ),
      });
      await db.collection("fila_paiva").doc(checkoutAtivo.id).delete();
      addToast("Atendimento encerrado e valor registrado.", "sucesso");
      setCheckoutAtivo(null);
    } catch (e) {
      addToast("Erro ao processar finalização.", "erro");
    } finally {
      setLoadingAction(null);
    }
  };

  const llamarCliente = async (id: string) => {
    setLoadingAction(id);
    try {
      await db
        .collection("fila_paiva")
        .doc(id)
        .update({ status: "atendendo", barbeiroPref: barbeiroLogado.nome });
      addToast("Cliente chamado.", "info");
    } catch (e) {
      addToast("Erro ao chamar cliente.", "erro");
    } finally {
      setLoadingAction(null);
    }
  };

  const limparFilaCompleta = async () => {
    if (!confirm("Deseja zerar toda a fila?")) return;
    const snap = await db.collection("fila_paiva").get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
    addToast("Fila limpa.", "info");
  };

  const limparHistoricoCompleto = async () => {
    if (!confirm("Deseja apagar TODO o histórico? Esta ação é irreversível."))
      return;
    try {
      const snap = await db.collection("historico_paiva").get();
      const batch = db.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      addToast("Histórico expurgado.", "sucesso");
    } catch (e) {
      addToast("Erro ao limpar histórico.", "erro");
    }
  };

  // --- LÓGICA DE CÁLCULOS FINANCEIROS ---
  const getStats = (barbeiroName?: string) => {
    const agora = new Date();
    const hoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    ).getTime();

    // Início da semana (considerando Domingo como 0)
    const diaSemana = agora.getDay();
    const diffSemana = agora.getDate() - diaSemana;
    const semana = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      diffSemana
    ).getTime();

    // Início do mês
    const mes = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();

    const hist = barbeiroName
      ? historicoAtendimentos.filter((h) => h.barbeiro === barbeiroName)
      : historicoAtendimentos;

    const totalHoje = hist
      .filter((h) => h.dataConclusao?.toMillis() >= hoje)
      .reduce((acc, curr) => acc + (curr.valor || 0), 0);
    const totalSemana = hist
      .filter((h) => h.dataConclusao?.toMillis() >= semana)
      .reduce((acc, curr) => acc + (curr.valor || 0), 0);
    const totalMes = hist
      .filter((h) => h.dataConclusao?.toMillis() >= mes)
      .reduce((acc, curr) => acc + (curr.valor || 0), 0);

    return { totalHoje, totalSemana, totalMes };
  };

  const ServiceBadge = ({ servico }: { servico: string }) => {
    const colors: any = {
      Cabelo: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      Barba: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      Completo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
          colors[servico] || colors["Cabelo"]
        }`}
      >
        {servico}
      </span>
    );
  };

  // --- RENDERS ---
  if (modo === "selecao") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-12 text-center text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

        <m.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 pt-10"
        >
          <h1 className="text-8xl font-black uppercase italic tracking-tighter neon-yellow leading-none text-white mb-4">
            ELITE CARIOCA
          </h1>
          <p className="text-blue-500 font-bold tracking-[0.8em] uppercase text-sm neon-blue">
            Luxury Barber Experience
          </p>
        </m.div>

        <m.div
          className="relative z-10 flex flex-col items-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setNovoCliente({
                nome: "",
                sobrenome: "",
                whatsapp: "",
                cpf: "",
                foto: "",
                barbeiroPref: "Sem Preferência",
                servico: "Cabelo",
              });
              setModo("cliente_registro");
            }}
            className="group relative"
          >
            <m.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-yellow-500 rounded-[4rem] blur-2xl"
            />
            <div className="relative glass h-80 w-80 md:h-[450px] md:w-[450px] rounded-[5rem] flex flex-col items-center justify-center gap-8 border-2 border-yellow-500/30 group-hover:border-yellow-500/60 transition-all shadow-2xl">
              <div className="p-8 bg-yellow-500/10 rounded-full group-hover:bg-yellow-500/20 transition-all">
                <Scissors
                  size={100}
                  className="text-yellow-500 group-hover:rotate-12 transition-transform duration-500"
                />
              </div>
              <div className="space-y-2">
                <span className="block font-black text-4xl md:text-6xl uppercase tracking-tighter">
                  Quero Cortar
                </span>
                <span className="block text-blue-400 font-bold uppercase text-[10px] md:text-xs tracking-[0.4em] opacity-70">
                  Toque para iniciar
                </span>
              </div>
            </div>
          </m.button>
        </m.div>

        <m.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 w-full flex justify-between items-end"
        >
          <button
            onClick={() => setModo("painel")}
            className="group flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-all p-4"
          >
            <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 group-hover:border-blue-500/30">
              <Tv
                size={24}
                className="text-slate-500 group-hover:text-blue-500"
              />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
              Painel TV
            </span>
          </button>

          <div className="glass-slim px-6 py-4 rounded-[2rem] border border-white/5 flex items-center gap-4 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <Lock
                size={14}
                className={
                  bloqueadoAte
                    ? "text-yellow-500 animate-pulse"
                    : "text-slate-600"
                }
              />
              <input
                type="password"
                disabled={!!bloqueadoAte}
                placeholder={
                  bloqueadoAte
                    ? `BLOQUEADO ${Math.floor(segundosRestantes / 60)}:${(
                        segundosRestantes % 60
                      )
                        .toString()
                        .padStart(2, "0")}`
                    : "PIN / MATRÍCULA"
                }
                className={`w-40 bg-transparent text-center font-black text-xs outline-none transition-all placeholder:text-slate-700 ${
                  bloqueadoAte
                    ? "text-yellow-500 opacity-100"
                    : "text-white focus:text-yellow-500"
                }`}
                value={acessoInput}
                onChange={(e) => setAcessoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAcessoUnificado()}
              />
            </div>
            <button
              disabled={!!bloqueadoAte || !acessoInput}
              onClick={handleAcessoUnificado}
              className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${
                bloqueadoAte
                  ? "text-slate-700 cursor-not-allowed"
                  : "text-blue-500 hover:bg-blue-500/10"
              }`}
            >
              OK
            </button>
          </div>
        </m.div>

        <ISDSignature />
        <EliteToasts toasts={toasts} />
      </div>
    );
  }

  if (modo === "biometria") {
    return (
      <div
        className={`min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center transition-colors ${
          flash ? "bg-white" : ""
        }`}
      >
        <button
          onClick={() => setModo("cliente_registro")}
          className="absolute top-10 left-10 text-slate-600 hover:text-white flex items-center gap-2 font-bold uppercase text-xs transition-colors"
        >
          <ArrowLeft size={16} /> Cancelar
        </button>
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">
            Biometria Facial
          </h2>
          <p className="text-yellow-500 font-bold uppercase text-[10px] tracking-widest opacity-70">
            Identificação Elite Carioca
          </p>
        </div>
        <div className="relative w-80 h-80 rounded-[4rem] border-4 border-yellow-500 overflow-hidden bg-slate-900 mb-10 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover grayscale opacity-50"
          />
          <div className="absolute inset-0 z-10 scanner-line" />
        </div>
        <button
          onClick={tirarFoto}
          className="bg-yellow-600 px-12 py-5 rounded-3xl font-black uppercase flex items-center gap-3 hover:scale-105 shadow-xl shadow-yellow-900/40"
        >
          <Camera size={24} /> Escanear Agora
        </button>
        <canvas ref={canvasRef} width="400" height="400" className="hidden" />
        <ISDSignature />
      </div>
    );
  }

  if (modo === "cliente_registro") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <GlassContainer className="w-full max-w-lg space-y-8">
          <button
            onClick={() => setModo("selecao")}
            className="text-slate-500 hover:text-white flex items-center gap-2 font-bold uppercase text-[10px] transition-colors"
          >
            <ArrowLeft size={14} /> Início
          </button>
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-tighter neon-yellow">
              Cadastro
            </h2>
            <p className="text-blue-400 font-bold uppercase text-[10px] tracking-widest neon-blue">
              Fila de Atendimento
            </p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="NOME"
              className="w-full p-5 bg-slate-950 rounded-2xl text-white font-bold border border-white/5 outline-none focus:border-yellow-500"
              value={novoCliente.nome}
              onChange={(e) =>
                setNovoCliente({ ...novoCliente, nome: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="SOBRENOME"
              className="w-full p-5 bg-slate-950 rounded-2xl text-white font-bold border border-white/5 outline-none focus:border-yellow-500"
              value={novoCliente.sobrenome}
              onChange={(e) =>
                setNovoCliente({ ...novoCliente, sobrenome: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="WHATSAPP (OPCIONAL)"
              className="w-full p-5 bg-slate-950 rounded-2xl text-white font-bold border border-white/5 outline-none focus:border-yellow-500"
              value={novoCliente.whatsapp}
              onChange={(e) =>
                setNovoCliente({ ...novoCliente, whatsapp: e.target.value })
              }
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 text-center block tracking-widest">
              Serviço
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["Cabelo", "Barba", "Completo"].map((s) => (
                <button
                  key={s}
                  onClick={() => setNovoCliente({ ...novoCliente, servico: s })}
                  className={`py-4 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all ${
                    novoCliente.servico === s
                      ? "bg-yellow-500 border-yellow-400 text-slate-950"
                      : "bg-slate-900 border-white/5 text-slate-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setModo("biometria")}
              className="p-6 bg-slate-900 border border-white/10 rounded-2xl text-slate-400 hover:text-yellow-500 transition-all flex items-center justify-center gap-3 flex-1"
            >
              <Camera size={24} />{" "}
              <span className="font-black uppercase text-[10px] tracking-widest">
                {novoCliente.foto ? "Alterar" : "Foto"}
              </span>
            </button>
            {novoCliente.foto && (
              <div className="w-16 h-16 rounded-xl border border-yellow-500/30 overflow-hidden">
                <img
                  src={novoCliente.foto}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <m.button
            whileHover={{ scale: 1.02 }}
            disabled={!novoCliente.nome}
            onClick={() => setModo("barbeiro_choice")}
            className={`w-full p-8 rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] transition-all ${
              novoCliente.nome
                ? "bg-yellow-600 shadow-yellow-900/20 text-white"
                : "bg-slate-800 text-slate-600"
            }`}
          >
            Prosseguir
          </m.button>
        </GlassContainer>
        <ISDSignature />
        <EliteToasts toasts={toasts} />
      </div>
    );
  }

  if (modo === "barbeiro_choice") {
    const barbeirosDisponiveis = profissionais.filter(
      (p) => p.status === "disponivel"
    );
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-5xl font-black mb-12 uppercase italic neon-yellow">
          Quem vai te atender?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <GlassContainer
            onClick={() => cadastrarCliente("Sem Preferência")}
            className="bg-yellow-600/10 border-yellow-500/20 flex flex-col items-center gap-2 cursor-pointer hover:bg-yellow-600"
          >
            <Zap size={32} className="text-yellow-500" />
            <span className="font-black text-xl uppercase">
              Sem Preferência
            </span>
          </GlassContainer>
          {barbeirosDisponiveis.map((p) => (
            <GlassContainer
              key={p.id}
              onClick={() => cadastrarCliente(p.nome)}
              className="flex flex-col items-center gap-2 cursor-pointer border-white/10 hover:border-yellow-500"
            >
              <Scissors size={24} className="text-yellow-500" />
              <span className="font-black text-xl uppercase">{p.nome}</span>
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Disponível
              </div>
            </GlassContainer>
          ))}
          {barbeirosDisponiveis.length === 0 && (
            <p className="col-span-full text-slate-500 uppercase text-xs font-bold italic tracking-widest">
              Nenhum profissional disponível.
            </p>
          )}
        </div>
        <ISDSignature />
      </div>
    );
  }

  if (modo === "painel") {
    const profissionaisVisiveis = profissionais.filter(
      (p) => p.status === "disponivel" || p.status === "ocupado"
    );
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-white flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
          <button
            onClick={() => setModo("selecao")}
            className="bg-slate-900 p-4 rounded-3xl text-slate-500 hover:text-white transition-all"
          >
            <ArrowLeft size={32} />
          </button>
          <div className="text-center">
            <h1 className="text-5xl font-black uppercase italic tracking-widest neon-yellow">
              ELITE CARIOCA
            </h1>
            <p className="text-blue-500 font-bold tracking-[0.6em] text-[10px] uppercase neon-blue">
              TV Dashboard
            </p>
          </div>
          <div className="text-right text-4xl font-black font-mono">
            {new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 flex-1">
          <AnimatePresence mode="popLayout">
            <m.div layout className="flex flex-col">
              <GlassContainer className="bg-slate-900/30 border-blue-500/20 flex-1 flex flex-col">
                <h3 className="text-center font-black text-blue-400 uppercase text-xs tracking-widest mb-8 border-b border-white/5 pb-4">
                  Fila Geral
                </h3>
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                  {clientesFila
                    .filter(
                      (c) =>
                        c.barbeiroPref === "Sem Preferência" &&
                        c.status === "esperando"
                    )
                    .map((c, i) => (
                      <m.div
                        layout
                        key={c.id}
                        className={`p-6 rounded-3xl text-center font-black ${
                          i === 0
                            ? "bg-emerald-600 shadow-lg"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        <span className="text-2xl block">
                          {c.nome.toUpperCase()}
                        </span>
                        <ServiceBadge servico={c.servico} />
                      </m.div>
                    ))}
                </div>
              </GlassContainer>
            </m.div>
            {profissionaisVisiveis.map((p) => (
              <m.div layout key={p.id} className="flex flex-col">
                <GlassContainer className="bg-slate-900/30 border-yellow-500/20 flex-1 flex flex-col">
                  <h3 className="text-center font-black text-yellow-400 uppercase text-xs tracking-widest mb-8 border-b border-white/5 pb-4 flex justify-center items-center gap-2">
                    {p.nome}{" "}
                    <div
                      className={`w-2 h-2 rounded-full ${
                        p.status === "disponivel"
                          ? "bg-emerald-500"
                          : "bg-yellow-500"
                      }`}
                    />
                  </h3>
                  <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                    {clientesFila
                      .filter(
                        (c) =>
                          c.barbeiroPref === p.nome && c.status === "esperando"
                      )
                      .map((c, i) => (
                        <m.div
                          layout
                          key={c.id}
                          className={`p-6 rounded-3xl text-center font-black ${
                            i === 0
                              ? "bg-yellow-600 shadow-lg"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          <span className="text-2xl block">
                            {c.nome.toUpperCase()}
                          </span>
                          <ServiceBadge servico={c.servico} />
                        </m.div>
                      ))}
                  </div>
                </GlassContainer>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
        <ISDSignature />
      </div>
    );
  }

  if (modo === "admin_barbeiro" && barbeiroLogado) {
    const minhaFila = [
      ...clientesFila.filter(
        (c) =>
          c.barbeiroPref === barbeiroLogado.nome && c.status === "esperando"
      ),
      ...clientesFila.filter(
        (c) => c.barbeiroPref === "Sem Preferência" && c.status === "esperando"
      ),
    ];
    const emAtendimento = clientesFila.filter(
      (c) => c.barbeiroPref === barbeiroLogado.nome && c.status === "atendendo"
    );
    const statsBarbeiro = getStats(barbeiroLogado.nome);

    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-white">
        <GlassContainer className="w-full max-w-5xl space-y-10">
          <div className="flex justify-between items-center border-b border-white/5 pb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-yellow-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-yellow-900/40">
                <Scissors size={40} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter neon-yellow">
                {barbeiroLogado.nome}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowGanhosModal(true)}
                className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-3xl text-blue-400 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all"
              >
                <Banknote size={20} /> Meus Ganhos
              </button>
              <button
                onClick={() => {
                  setBarbeiroLogado(null);
                  setModo("selecao");
                }}
                className="p-5 bg-slate-900 rounded-3xl text-red-500"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {["disponivel", "ocupado", "ausente"].map((status: any) => (
              <button
                key={status}
                onClick={() => mudarStatus(status)}
                className={`p-6 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 border-2 transition-all ${
                  barbeiroLogado.status === status
                    ? status === "disponivel"
                      ? "bg-emerald-600"
                      : status === "ocupado"
                      ? "bg-yellow-600"
                      : "bg-red-600"
                    : "bg-slate-900 opacity-40"
                }`}
              >
                <Circle
                  size={16}
                  fill={
                    barbeiroLogado.status === status ? "currentColor" : "none"
                  }
                />
                {status}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="font-black text-xs uppercase text-slate-500 tracking-widest flex items-center gap-3">
                <Users size={16} /> Minha Fila
              </h3>
              <div className="space-y-4 h-[400px] overflow-y-auto custom-scrollbar">
                {minhaFila.map((c, i) => (
                  <div
                    key={c.id}
                    className="p-6 bg-slate-900/50 rounded-[2.5rem] border border-white/5 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xl">
                        {c.nome.toUpperCase()}
                      </span>
                      <ServiceBadge servico={c.servico} />
                    </div>
                    {i === 0 && emAtendimento.length === 0 && (
                      <button
                        onClick={() => llamarCliente(c.id)}
                        className="px-8 py-4 bg-yellow-600 rounded-2xl text-[10px] font-black uppercase"
                      >
                        Chamar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-8">
              <h3 className="font-black text-xs uppercase text-emerald-500 tracking-widest flex items-center gap-3">
                <Play size={16} /> Em Atendimento
              </h3>
              {emAtendimento.map((c) => (
                <div
                  key={c.id}
                  className="p-10 bg-slate-900 rounded-[3rem] border-2 border-emerald-500/30 shadow-2xl space-y-10"
                >
                  <div className="text-center">
                    <h4 className="text-5xl font-black uppercase">{c.nome}</h4>
                    <div className="flex justify-center mt-2">
                      <ServiceBadge servico={c.servico} />
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutAtivo(c)}
                    className="w-full bg-emerald-600 p-8 rounded-[2rem] font-black uppercase hover:bg-emerald-500 transition-all shadow-xl"
                  >
                    Finalizar Serviço
                  </button>
                </div>
              ))}
              {emAtendimento.length === 0 && (
                <div className="h-[200px] border-2 border-dashed border-white/5 rounded-[3rem] flex items-center justify-center text-slate-700 font-black uppercase text-[10px] tracking-widest">
                  Nenhum atendimento ativo
                </div>
              )}
            </div>
          </div>
        </GlassContainer>

        {/* Modal Meus Ganhos */}
        <AnimatePresence>
          {showGanhosModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
              <GlassContainer className="w-full max-w-lg space-y-8 border-blue-500/30">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter neon-blue">
                    Meus Ganhos
                  </h3>
                  <button
                    onClick={() => setShowGanhosModal(false)}
                    className="p-3 bg-slate-900 rounded-2xl text-slate-500 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Hoje
                    </span>
                    <span className="text-2xl font-black text-white">
                      {formatBRL(statsBarbeiro.totalHoje)}
                    </span>
                  </div>
                  <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Esta Semana
                    </span>
                    <span className="text-2xl font-black text-white">
                      {formatBRL(statsBarbeiro.totalSemana)}
                    </span>
                  </div>
                  <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      Este Mês
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      {formatBRL(statsBarbeiro.totalMes)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowGanhosModal(false)}
                  className="w-full p-6 bg-blue-600 rounded-3xl font-black uppercase tracking-widest"
                >
                  Fechar Relatório
                </button>
              </GlassContainer>
            </div>
          )}
        </AnimatePresence>

        {/* Modal de Checkout */}
        <AnimatePresence>
          {checkoutAtivo && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
              <GlassContainer className="w-full max-w-md space-y-8 border-emerald-500/30">
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter neon-yellow">
                    Checkout
                  </h3>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
                    Encerrar: {checkoutAtivo.nome}
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-600 text-center block tracking-widest">
                    Valor do Serviço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    autoFocus
                    value={valorInput}
                    onChange={(e) => setValorInput(e.target.value)}
                    className="w-full bg-slate-950 p-8 rounded-[2rem] text-5xl font-black text-center text-white outline-none border-2 border-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCheckoutAtivo(null)}
                    className="p-6 bg-slate-900 rounded-3xl font-black uppercase text-xs text-slate-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarFinalizacao}
                    className="p-6 bg-emerald-600 rounded-3xl font-black uppercase text-xs text-white shadow-xl shadow-emerald-900/20"
                  >
                    Confirmar
                  </button>
                </div>
              </GlassContainer>
            </div>
          )}
        </AnimatePresence>

        <ISDSignature />
        <EliteToasts toasts={toasts} />
      </div>
    );
  }

  if (modo === "gestao_master") {
    const statsMaster = getStats();

    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white flex flex-col relative overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full space-y-10 mb-20">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setModo("selecao")}
              className="bg-slate-900 px-6 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest border border-white/5"
            >
              <ArrowLeft size={16} className="inline mr-2" /> Sair
            </button>
            <div className="flex gap-4">
              <button
                onClick={limparFilaCompleta}
                className="bg-red-600/10 text-red-500 border border-red-500/20 px-6 py-4 rounded-3xl font-black uppercase text-[10px]"
              >
                <Eraser size={18} className="inline mr-2" /> Zerar Fila
              </button>
              <div className="p-4 bg-yellow-600 rounded-3xl shadow-xl shadow-yellow-900/20">
                <Crown size={24} />
              </div>
            </div>
          </div>

          {/* DASHBOARD FINANCEIRO MASTER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassContainer className="bg-slate-900/40 border-emerald-500/20 group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500">
                  <Banknote size={24} />
                </div>
                <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500">
                  Hoje
                </h4>
              </div>
              <span className="text-4xl font-black text-white">
                {formatBRL(statsMaster.totalHoje)}
              </span>
              <div className="mt-4 flex items-center gap-2 text-[8px] font-black uppercase text-emerald-500/60">
                <TrendingUp size={12} /> Atualizado agora
              </div>
            </GlassContainer>
            <GlassContainer className="bg-slate-900/40 border-blue-500/20 group hover:border-blue-500/40 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
                  <Calendar size={24} />
                </div>
                <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500">
                  Esta Semana
                </h4>
              </div>
              <span className="text-4xl font-black text-white">
                {formatBRL(statsMaster.totalSemana)}
              </span>
            </GlassContainer>
            <GlassContainer className="bg-slate-900/40 border-yellow-500/20 group hover:border-yellow-500/40 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-yellow-500/10 rounded-2xl text-yellow-500">
                  <TrendingUp size={24} />
                </div>
                <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500">
                  Este Mês
                </h4>
              </div>
              <span className="text-4xl font-black text-white">
                {formatBRL(statsMaster.totalMes)}
              </span>
            </GlassContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <GlassContainer className="lg:col-span-1 space-y-8">
              <h3 className="font-black uppercase tracking-tighter text-2xl text-yellow-500">
                Novo Profissional
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="NOME"
                  className="w-full bg-slate-950 p-5 rounded-2xl border border-white/5 text-white font-bold"
                  value={novoProf.nome}
                  onChange={(e) =>
                    setNovoProf({ ...novoProf, nome: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="MATRÍCULA (3 DÍGITOS)"
                  className="w-full bg-slate-950 p-5 rounded-2xl border border-white/5 text-white font-mono text-center text-xl"
                  value={novoProf.matricula}
                  onChange={(e) =>
                    setNovoProf({ ...novoProf, matricula: e.target.value })
                  }
                />
                <button
                  onClick={async () => {
                    if (!novoProf.nome || !novoProf.matricula)
                      return addToast("Dados incompletos.", "erro");
                    await db
                      .collection("profissionais")
                      .add({ ...novoProf, status: "ausente" });
                    setNovoProf({ nome: "", matricula: "" });
                    addToast("Barbeiro cadastrado.", "sucesso");
                  }}
                  className="w-full bg-yellow-600 p-6 rounded-2xl font-black uppercase tracking-widest"
                >
                  Salvar
                </button>
              </div>
            </GlassContainer>
            <GlassContainer className="lg:col-span-2 space-y-8">
              <h3 className="font-black uppercase tracking-tighter text-2xl flex items-center gap-3">
                Equipe Ativa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[250px] overflow-y-auto custom-scrollbar">
                {profissionais.map((p) => (
                  <div
                    key={p.id}
                    className="p-6 bg-slate-950/50 rounded-[2rem] border border-white/5 flex justify-between items-center group"
                  >
                    <div className="space-y-1">
                      <span className="block font-black text-sm uppercase">
                        {p.nome}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase">
                        ID: {p.matricula}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm("Excluir profissional?"))
                          await db
                            .collection("profissionais")
                            .doc(p.id)
                            .delete();
                      }}
                      className="p-3 bg-red-600/10 text-red-500 rounded-xl opacity-20 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassContainer>
          </div>

          <GlassContainer className="w-full space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="font-black uppercase tracking-tighter text-2xl flex items-center gap-3">
                <Clock size={28} className="text-blue-500" /> Histórico
                Detalhado
              </h3>
              <button
                onClick={limparHistoricoCompleto}
                className="bg-red-600/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-2xl font-black uppercase text-[9px] flex items-center gap-2"
              >
                <Trash2 size={14} /> Limpar Histórico
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase font-black text-slate-700 border-b border-white/5">
                  <tr>
                    <th className="pb-6 px-4">Cliente</th>
                    <th className="pb-6 px-4 text-center">Barbeiro</th>
                    <th className="pb-6 px-4 text-center">Serviço</th>
                    <th className="pb-6 px-4 text-center">Valor</th>
                    <th className="pb-6 px-4 text-right">Hora</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {historicoAtendimentos.map((h) => (
                    <tr
                      key={h.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-6 px-4 font-black uppercase text-slate-300 tracking-tighter text-lg">
                        {h.nome}
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[10px] font-black uppercase text-yellow-500">
                          <Scissors size={10} className="inline mr-1" />{" "}
                          {h.barbeiro}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <ServiceBadge servico={h.servico} />
                      </td>
                      <td className="py-6 px-4 text-center font-black text-emerald-400">
                        {formatBRL(h.valor || 0)}
                      </td>
                      <td className="py-6 px-4 text-right text-slate-500 font-mono">
                        {h.dataConclusao?.toDate().toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassContainer>
        </div>
        <ISDSignature />
        <EliteToasts toasts={toasts} />
      </div>
    );
  }
  return null;
};

const EliteToasts = ({ toasts }: { toasts: any[] }) => {
  const m = motion as any;
  return (
    <div className="fixed top-10 right-10 z-[200] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <m.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className={`pointer-events-auto glass-slim min-w-[300px] p-6 rounded-3xl border flex items-center gap-4 shadow-2xl ${
              toast.type === "sucesso"
                ? "border-emerald-500/30"
                : toast.type === "erro"
                ? "border-red-500/30"
                : "border-blue-500/30"
            }`}
          >
            <div
              className={`p-3 rounded-2xl ${
                toast.type === "sucesso"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : toast.type === "erro"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-blue-500/10 text-blue-500"
              }`}
            >
              {toast.type === "sucesso" ? (
                <Check size={20} />
              ) : toast.type === "erro:" ? (
                <AlertCircle size={20} />
              ) : (
                <Info size={20} />
              )}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-white/90">
              {toast.message}
            </p>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default App;
