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

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// CONFIGURAÇÃO FIREBASE RECUPERADA
const firebaseConfig = {
  apiKey: "AIzaSyAU5crOPK6roszFly_pyl0G7CcsYFvjm6U",
  authDomain: "sistema-barbearia-acb02.firebaseapp.com",
  projectId: "sistema-barbearia-acb02",
  storageBucket: "sistema-barbearia-acb02.firebasestorage.app",
  messagingSenderId: "149768423148",
  appId: "1:149768423148:web:59189c3c1912ab98d847c9",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

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
  const [modo, setModo] = useState<any>("selecao");
  const [clientesFila, setClientesFila] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [historicoAtendimentos, setHistoricoAtendimentos] = useState<any[]>([]);
  const [barbeiroLogado, setBarbeiroLogado] = useState<any | null>(null);
  const [checkoutAtivo, setCheckoutAtivo] = useState<any | null>(null);
  const [valorInput, setValorInput] = useState<string>("50.00");
  const [showGanhosModal, setShowGanhosModal] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [tentativasPIN, setTentativasPIN] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevClientesRef = useRef<any[]>([]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  useEffect(() => {
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    );
  }, []);

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
          if (clienteChamado) audioRef.current?.play().catch(() => {});
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
      .limit(100)
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

  useEffect(() => {
    if (modo === "biometria") abrirCamera();
    else if (modo === "selecao") pararCamera();
  }, [modo]);

  useEffect(() => {
    let interval: any;
    if (bloqueadoAte) {
      interval = setInterval(() => {
        const rest = Math.ceil((bloqueadoAte - Date.now()) / 1000);
        if (rest <= 0) {
          setBloqueadoAte(null);
          setTentativasPIN(0);
          setSegundosRestantes(0);
        } else setSegundosRestantes(rest);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bloqueadoAte]);

  const abrirCamera = async () => {
    try {
      pararCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err: any) {
      addToast("Erro na câmera.", "erro");
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
      setNovoCliente((prev) => ({
        ...prev,
        foto: canvasRef.current!.toDataURL("image/png"),
      }));
      pararCamera();
      setModo("cliente_registro");
    }
  };

  const handleAcessoUnificado = () => {
    if (bloqueadoAte) return;
    if (acessoInput === "123456") {
      setModo("gestao_master");
      setAcessoInput("");
      return;
    }
    const prof = profissionais.find((p) => p.matricula === acessoInput);
    if (prof) {
      setBarbeiroLogado(prof);
      setModo("admin_barbeiro");
      setAcessoInput("");
    } else {
      const n = tentativasPIN + 1;
      setTentativasPIN(n);
      setAcessoInput("");
      if (n >= 3) setBloqueadoAte(Date.now() + 300000);
    }
  };

  const addToast = (message: string, type: any = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    );
  };

  const ServiceBadge = ({ servico }: { servico: string }) => {
    const colors: any = {
      Cabelo: "text-blue-400",
      Barba: "text-orange-400",
      Completo: "text-emerald-400",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full border border-white/10 text-[8px] font-black uppercase ${colors[servico]}`}
      >
        {servico}
      </span>
    );
  };

  // Renders básicos para garantir funcionamento
  if (modo === "selecao")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-12 text-center text-white relative">
        <div className="pt-10">
          <h1 className="text-8xl font-black italic neon-yellow">
            ELITE CARIOCA
          </h1>
        </div>
        <button
          onClick={() => setModo("cliente_registro")}
          className="glass h-80 w-80 rounded-[5rem] flex flex-col items-center justify-center gap-8 border-2 border-yellow-500/30"
        >
          <Scissors size={100} className="text-yellow-500" />
          <span className="font-black text-4xl uppercase">Quero Cortar</span>
        </button>
        <div className="w-full flex justify-between items-end">
          <button onClick={() => setModo("painel")}>
            <Tv size={24} className="opacity-30 hover:opacity-100" />
          </button>
          <div className="glass-slim px-6 py-4 rounded-[2rem] flex items-center gap-4">
            <input
              type="password"
              placeholder="PIN"
              className="w-20 bg-transparent text-center font-black text-xs outline-none"
              value={acessoInput}
              onChange={(e) => setAcessoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAcessoUnificado()}
            />
            <button
              onClick={handleAcessoUnificado}
              className="text-blue-500 font-black text-[9px]"
            >
              OK
            </button>
          </div>
        </div>
        <ISDSignature />
        <EliteToasts toasts={toasts} />
      </div>
    );

  // Telas simplificadas para retorno rápido à operação
  if (modo === "cliente_registro")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <GlassContainer className="w-full max-w-lg space-y-8 text-center">
          <h2 className="text-4xl font-black uppercase neon-yellow">
            Cadastro
          </h2>
          <input
            type="text"
            placeholder="NOME"
            className="w-full p-5 bg-slate-900 rounded-2xl outline-none"
            value={novoCliente.nome}
            onChange={(e) =>
              setNovoCliente({ ...novoCliente, nome: e.target.value })
            }
          />
          <div className="grid grid-cols-3 gap-3">
            {["Cabelo", "Barba", "Completo"].map((s) => (
              <button
                key={s}
                onClick={() => setNovoCliente({ ...novoCliente, servico: s })}
                className={`p-4 rounded-xl font-black text-[10px] ${
                  novoCliente.servico === s
                    ? "bg-yellow-500 text-black"
                    : "bg-slate-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setModo("barbeiro_choice")}
            className="w-full p-8 bg-yellow-600 rounded-[2rem] font-black uppercase"
          >
            Prosseguir
          </button>
          <button
            onClick={() => setModo("selecao")}
            className="text-xs opacity-50"
          >
            Cancelar
          </button>
        </GlassContainer>
      </div>
    );

  if (modo === "barbeiro_choice")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-5xl font-black mb-12 neon-yellow">
          Escolha o Barbeiro
        </h2>
        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => {
              db.collection("fila_paiva").add({
                ...novoCliente,
                barbeiroPref: "Sem Preferência",
                status: "esperando",
                chegada: firebase.firestore.Timestamp.now(),
              });
              setModo("selecao");
            }}
            className="glass p-10 flex flex-col items-center gap-4"
          >
            <Zap className="text-yellow-500" /> Geral
          </button>
          {profissionais
            .filter((p) => p.status === "disponivel")
            .map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  db.collection("fila_paiva").add({
                    ...novoCliente,
                    barbeiroPref: p.nome,
                    status: "esperando",
                    chegada: firebase.firestore.Timestamp.now(),
                  });
                  setModo("selecao");
                }}
                className="glass p-10 flex flex-col items-center gap-4"
              >
                <Scissors className="text-yellow-500" /> {p.nome}
              </button>
            ))}
        </div>
      </div>
    );

  if (modo === "painel")
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-white flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => setModo("selecao")}>
            <ArrowLeft />
          </button>
          <h1 className="text-4xl font-black neon-yellow">
            PAINEL DE ATENDIMENTO
          </h1>
        </div>
        <div className="grid grid-cols-4 gap-6">
          <GlassContainer className="border-blue-500/20">
            <h3>FILA GERAL</h3>
            {clientesFila
              .filter(
                (c) =>
                  c.barbeiroPref === "Sem Preferência" &&
                  c.status === "esperando"
              )
              .map((c) => (
                <div key={c.id} className="p-4 bg-slate-800 rounded-xl mb-2">
                  {c.nome}
                </div>
              ))}
          </GlassContainer>
          {profissionais
            .filter((p) => p.status !== "ausente")
            .map((p) => (
              <GlassContainer key={p.id}>
                <h3>{p.nome}</h3>
                {clientesFila
                  .filter(
                    (c) => c.barbeiroPref === p.nome && c.status === "esperando"
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-yellow-600 text-black font-black rounded-xl mb-2"
                    >
                      {c.nome}
                    </div>
                  ))}
              </GlassContainer>
            ))}
        </div>
      </div>
    );

  // Administrações simplificadas para não travar
  if (modo === "gestao_master" || modo === "admin_barbeiro")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl mb-4">Módulo Administrativo Carregado</h2>
        <button
          onClick={() => setModo("selecao")}
          className="bg-yellow-600 p-4 rounded-xl"
        >
          Voltar ao Início
        </button>
      </div>
    );

  return null;
};

const EliteToasts = ({ toasts }: { toasts: any[] }) => (
  <div className="fixed top-10 right-10 z-[200] flex flex-col gap-4">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="glass-slim p-4 rounded-xl border border-white/10 text-xs font-bold"
        >
          {t.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export default App;
