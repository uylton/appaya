
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { EmailAccessCode } from "@/entities/EmailAccessCode";
import { SendEmail } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Home, Calendar, MapPin, Users, Trophy, LogOut, Menu, ArrowUp, UserCheck, 
  BarChart3, FileText, MessageSquare, Key, Loader2, User as UserIcon, RefreshCw
} from "lucide-react";

// Lista de códigos disponíveis
const availableCodes = [
  "aF3X1", "T9bK2", "L1mQ4", "xZ2P0", "F7kR3", "pD5T9", "G3vJ8", "hR4X2", "M2nQ7", "sL1C9",
  "K8qF0", "tB3X6", "V1mJ4", "dP7W2", "J5xC9", "zL2N3", "Q4hF8", "yR1T5", "N3cV7", "bS9K0",
  "H6xM2", "fT1G7", "P9kD4", "eL3Q8", "R2vJ5", "gB7X1", "W4nF9", "mC5K2", "Y1pL6", "sQ3D7",
  "D2xN5", "uF9J1", "X3mK7", "hG6L2", "B7vQ4", "tR1C8", "L4kP9", "nS2W3", "Z5xF1", "jV8H2"
];

// Lista de bandeiras da África + Brasil
const africanFlags = [
  "za", "ao", "dz", "bj", "bw", "br", "bf", "bi", "cv", "cm", "td", "km", "cg",
  "ci", "dj", "eg", "er", "sz", "et", "ga", "gm", "gh", "gn", "gw", "gq", "ls",
  "lr", "ly", "mg", "mw", "ml", "ma", "mu", "mr", "mz", "na", "ne", "ng", "ke",
  "cf", "cd", "rw", "st", "sn", "sl", "sc", "so", "sd", "ss", "tz", "tg", "tn",
  "ug", "zm", "zw"
];

const BandeiraCarousel = () => (
  <div className="bandeira-carousel">
    <div className="bandeira-track">
      {[...africanFlags, ...africanFlags].map((code, index) => (
        <img key={index} src={`https://flagcdn.com/${code}.svg`} alt={`bandeira ${code}`} />
      ))}
    </div>
  </div>
);

const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`botao-topo-fixo ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <ArrowUp />
    </button>
  );
};

const UpdateNotification = () => {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const APP_VERSION = "1.3.0"; // Versão atual do app - atualize quando fizer mudanças

  useEffect(() => {
    const savedVersion = localStorage.getItem('app_version');
    if (!savedVersion || savedVersion !== APP_VERSION) {
      setShowUpdateNotification(true);
    }
  }, []);

  const handleUpdate = () => {
    localStorage.setItem('app_version', APP_VERSION);
    setShowUpdateNotification(false);
    window.location.reload();
  };

  const handleDismiss = () => {
    localStorage.setItem('app_version', APP_VERSION);
    setShowUpdateNotification(false);
  };

  if (!showUpdateNotification) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 z-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5" />
        <span className="text-sm">Nova atualização disponível!</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={handleUpdate}>
          Atualizar
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-white hover:text-gray-200">
          Depois
        </Button>
      </div>
    </div>
  );
};

const AccessCodeGate = ({ user, onVerified }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const masterCode = "uvc95";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) return;
    setIsVerifying(true);
    setError("");

    try {
      // Verificar código mestre
      if (code === masterCode) {
        // Master code also sets profile_type to admin temporarily for verification
        // This will be overridden by loadUser if user email is not adminEmail
        await User.updateMyUserData({ 
          has_entered_access_code: true,
          profile_type: 'student' // Assume student, will be admin if adminEmail
        }); 
        onVerified();
        setIsVerifying(false);
        return;
      }

      // Verificar código específico do email
      const emailCodeResult = await EmailAccessCode.filter({ 
        email: user.email, 
        access_code: code 
      });

      if (emailCodeResult.length > 0) {
        // Garantir que o usuário seja marcado como 'student' ao validar o código
        await User.updateMyUserData({ 
          has_entered_access_code: true,
          profile_type: 'student' // Garantir que seja marcado como aluno
        });
        await EmailAccessCode.update(emailCodeResult[0].id, { is_used: true });
        onVerified();
      } else {
        setError("Código inválido para este email. Verifique seu email ou solicite um novo código.");
      }
    } catch (err) {
      setError("Erro ao verificar código. Tente novamente.");
      console.error(err);
    }
    setIsVerifying(false);
  };

  const requestAccessCode = async () => {
    setIsVerifying(true);
    try {
      // Verificar se já existe código para este email
      const existingCode = await EmailAccessCode.filter({ email: user.email });
      
      if (existingCode.length > 0) {
        // Reenviar código existente
        await SendEmail({
          to: user.email,
          subject: "Coletivo AYA - Seu Código de Acesso",
          body: `Olá ${user.full_name},\n\nSeu código de acesso ao sistema Coletivo AYA é: ${existingCode[0].access_code}\n\nDigite este código para acessar a plataforma.\n\nAxé!\nEquipe Coletivo AYA`
        });
        setError("Código reenviado para seu email!");
      } else {
        // Atribuir novo código
        const randomCode = availableCodes[Math.floor(Math.random() * availableCodes.length)];
        
        await EmailAccessCode.create({
          email: user.email,
          access_code: randomCode
        });

        await SendEmail({
          to: user.email,
          subject: "Coletivo AYA - Seu Código de Acesso",
          body: `Olá ${user.full_name},\n\nSeu código de acesso ao sistema Coletivo AYA é: ${randomCode}\n\nDigite este código para acessar a plataforma.\n\nAxé!\nEquipe Coletivo AYA`
        });
        
        setError("Código enviado para seu email!");
      }
    } catch (err) {
      setError("Erro ao enviar código. Tente novamente.");
      console.error(err);
    }
    setIsVerifying(false);
  };

  return (
    <div style={{fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: "radial-gradient(circle, rgba(255,99,71,0.3), rgba(79,79,79,0.2), rgba(107,142,35,0.3))"}} className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center" style={{backgroundColor: '#FDF5E6'}}>
        <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Código de Acesso</h1>
        <p className="text-gray-600 mb-4">Olá {user.full_name}!</p>
        <p className="text-gray-600 mb-6">Digite o código que foi enviado para seu email para acessar o sistema.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Digite seu código..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="text-center text-lg tracking-widest"
            maxLength={5}
          />
          {error && <p className={`text-sm ${error.includes('enviado') ? 'text-green-600' : 'text-red-500'}`}>{error}</p>}
          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar e Entrar"}
          </Button>
          <Button type="button" variant="outline" onClick={requestAccessCode} className="w-full" disabled={isVerifying}>
            Solicitar/Reenviar Código
          </Button>
        </form>
      </div>
    </div>
  );
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);

  const adminEmail = "uyltonprogsistem@gmail.com";

  useEffect(() => {
    loadUser();
  }, []);
  
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const loadUser = async () => {
    try {
      let currentUser = await User.me();
      setUser(currentUser);

      // Email admin mestre entra direto
      if (currentUser.email === adminEmail) {
        await User.updateMyUserData({ 
          profile_type: 'admin',
          has_entered_access_code: true 
        });
        // Reload user after update to get the latest profile_type
        currentUser = await User.me(); 
        setIsVerified(true);
      } else {
        // Para outros usuários, garantir que tenham profile_type definido como 'student' se não tiverem
        if (!currentUser.profile_type) {
          await User.updateMyUserData({ profile_type: 'student' });
          // Reload user after update to get the latest profile_type
          currentUser = await User.me(); 
        }
        
        // Verificar se já inseriu código
        if (currentUser.has_entered_access_code) {
          setIsVerified(true);
        } else {
          setShowAccessCode(true);
        }
      }
      setUser(currentUser); // Ensure the state reflects the potentially updated user
    } catch (error) {
      console.log("User not authenticated");
    }
    setIsLoading(false);
  };
  
  const handleLogout = async () => {
    await User.logout();
    window.location.href = "/";
  };

  const studentNavigation = [
    { title: "Dashboard", url: createPageUrl("StudentDashboard"), icon: Home },
    { title: "Meu Perfil", url: createPageUrl("Profile"), icon: UserIcon },
    { title: "Treinos", url: createPageUrl("Sessions"), icon: Calendar },
    { title: "Chat", url: createPageUrl("Chat"), icon: MessageSquare },
    { title: "Locais", url: createPageUrl("Locations"), icon: MapPin },
    { title: "Professores", url: createPageUrl("Teachers"), icon: Users },
    { title: "Eventos", url: createPageUrl("Events"), icon: Trophy },
  ];

  const adminNavigation = [
    { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: BarChart3 },
    { title: "Chat", url: createPageUrl("Chat"), icon: MessageSquare },
    { title: "Alunos", url: createPageUrl("StudentsManagement"), icon: UserCheck },
    { title: "Treinos", url: createPageUrl("SessionsManagement"), icon: Calendar },
    { title: "Professores", url: createPageUrl("TeachersManagement"), icon: Users },
    { title: "Locais", url: createPageUrl("LocationsManagement"), icon: MapPin },
    { title: "Eventos", url: createPageUrl("EventsManagement"), icon: Trophy },
    { title: "Presenças", url: createPageUrl("AttendanceManagement"), icon: UserCheck },
    { title: "Relatórios", url: createPageUrl("Reports"), icon: FileText },
  ];

  const navigation = user?.profile_type === 'admin' ? adminNavigation : studentNavigation;

  if (isLoading) {
    return (
      <div style={{fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: "radial-gradient(circle, rgba(255,99,71,0.3), rgba(79,79,79,0.2), rgba(107,142,35,0.3))"}} className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: "radial-gradient(circle, rgba(255,99,71,0.3), rgba(79,79,79,0.2), rgba(107,142,35,0.3))"}} className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center" style={{backgroundColor: '#FDF5E6'}}>
          <h1 className="text-3xl font-bold mb-2" style={{color: '#1C1C1C', fontFamily: 'Georgia, serif'}}>Coletivo AYA</h1>
          <p className="mb-6" style={{color: '#A9A9A9'}}>Sistema de Gestão de Capoeira</p>
          <button
            onClick={async () => await User.login()}
            className="w-full text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            style={{background: 'linear-gradient(to right, #FFD700, #B22222)'}}
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  if (showAccessCode && !isVerified) {
    return <AccessCodeGate user={user} onVerified={() => {
      setIsVerified(true);
      // Re-fetch user data to ensure `profile_type` and `has_entered_access_code` are updated
      loadUser(); 
    }} />;
  }

  return (
    <>
      <UpdateNotification />
      <style>{`
        :root {
          --primary-black: #1C1C1C;
          --gold: #FFD700;
          --gray: #A9A9A9;
          --white: #fff;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: radial-gradient(circle, rgba(255,99,71,0.3), rgba(79,79,79,0.2), rgba(107,142,35,0.3));
          z-index: 1;
        }
        .aya-header { background-color: #1C1C1C; color: #FFD700; padding: 20px 0; text-align: center; border-bottom: 4px solid #228B22; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4); width: 100%; z-index: 2; position: relative; }
        .aya-header h1 { margin: 0; font-family: 'Georgia', serif; font-size: 32px; letter-spacing: 1px; }
        .aya-header p { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; color: #f0e68c; }
        .aya-footer { background-color: #1C1C1C; color: #FFD700; padding: 20px 0; text-align: center; border-top: 4px solid #228B22; box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.4); width: 100%; position: relative; z-index: 2; margin-top: auto; }
        .bandeira-carousel { position: relative; z-index: 2; overflow: hidden; width: 100%; background-color: white; opacity: 0.9; padding: 5px 0; border-bottom: 1px solid #ccc; }
        .bandeira-track { display: flex; gap: 20px; padding: 0 10px; width: calc(2 * ( (40px + 20px) * ${africanFlags.length} )); animation: deslizarBandeiras 120s linear infinite; }
        .bandeira-track img { height: 24px; width: 40px; object-fit: cover; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        @keyframes deslizarBandeiras { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .botao-topo-fixo { position: fixed; bottom: 30px; right: 30px; background: linear-gradient(to right, #FFD700, #B22222); color: white; border: none; padding: 12px; font-size: 1.5rem; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.3); z-index: 1000; transition: background 0.3s, transform 0.3s, opacity 0.3s; display: flex; align-items: center; justify-content: center; }
        .botao-topo-fixo:hover { background: linear-gradient(to right, #228B22, #FFD700); transform: scale(1.1); }
        .marca-dagua { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: -1; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M50 10 Q70 30 50 50 Q30 30 50 10" fill="none" stroke="%23D4AF37" stroke-width="2"/></svg>'); background-repeat: no-repeat; background-position: center; background-size: 80vmin; opacity: 0.05; pointer-events: none; }
        .hamburger { display: none; font-size: 30px; cursor: pointer; color: #FFD700; position: fixed; top: 25px; left: 20px; z-index: 3000; }
        .aya-nav { background-color: #fff; padding: 5px 0; text-align: center; width: 100%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 10; }
        .aya-nav ul { list-style-type: none; padding: 0; margin: 0; }
        .aya-nav ul li { display: inline-block; margin: 0 5px; }
        .aya-nav ul li a { color: #00008B; text-decoration: none; font-weight: bold; cursor: pointer; display: flex; gap: 8px; align-items: center; padding: 10px 15px; font-family: Arial, sans-serif; border-radius: 8px; transition: background-color 0.2s, color 0.2s; }
        .aya-nav ul li a:hover, .aya-nav ul li a.active { background-color: #B0C4DE; color: black; }
        @media (max-width: 1024px) {
          .aya-nav { position: fixed; top: 0; left: -280px; width: 250px; height: 100%; background-color: rgba(253, 245, 230, 0.98); transition: left 0.3s ease; padding-top: 80px; box-shadow: 2px 0 10px rgba(0,0,0,0.3); z-index: 2000; text-align: left; overflow-y: auto; }
          .aya-nav.show { left: 0; }
          .aya-nav ul li { display: block; margin: 10px 0; }
          .aya-nav ul li a { padding: 10px 20px; width: 100%; border-radius: 0; }
          .hamburger { display: block; }
          .menu-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1999; }
          .menu-overlay.show { display: block; }
        }
        .nav-header { padding: 1rem; text-align: center; border-bottom: 1px solid #ddd; }
        .nav-footer { margin-top: auto; padding: 1rem; border-top: 1px solid #ddd; }
      `}</style>
      
      <div className="flex flex-col min-h-screen relative overflow-hidden">
        <div className="marca-dagua"></div>
        <BandeiraCarousel />
        <header className="aya-header">
          <div className="container mx-auto flex justify-between items-center px-4 relative">
            <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu size={30} />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Coletivo AYA</h1>
              <p className="text-sm">Sistema de Gestão de Capoeira</p>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-gold hidden md:block">Olá, {user.nickname || user.full_name}!</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-300 ease-in-out"
                >
                  <LogOut size={20} />
                  <span className="hidden md:block">Sair</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <nav className={`aya-nav ${isMenuOpen ? "show" : ""}`}>
          <div className="nav-header">
            <h2 className="text-xl font-bold text-gray-800">Navegação</h2>
          </div>
          <ul>
            {navigation.map((item) => (
              <li key={item.title}>
                <Link
                  to={item.url}
                  className={location.pathname === item.url ? "active" : ""}
                >
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
            {user && (
              <li className="block md:hidden">
                <button
                  onClick={handleLogout}
                  className="w-full text-red-600 hover:text-white hover:bg-red-600 font-bold py-2 px-4 flex items-center space-x-2 transition duration-300 ease-in-out"
                >
                  <LogOut size={20} />
                  <span>Sair</span>
                </button>
              </li>
            )}
          </ul>
          <div className="nav-footer">
            <p className="text-sm text-gray-500">
              Coletivo AYA &copy; {new Date().getFullYear()}
            </p>
          </div>
        </nav>
        {isMenuOpen && <div className="menu-overlay show" onClick={() => setIsMenuOpen(false)}></div>}

        <main className="flex-grow container mx-auto p-4 bg-white bg-opacity-90 shadow-lg rounded-lg my-4 relative z-10">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">{currentPageName}</h2>
          {children}
        </main>

        <footer className="aya-footer">
          <div className="container mx-auto px-4">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Coletivo AYA. Todos os direitos reservados.
            </p>
          </div>
        </footer>
        <BackToTopButton />
      </div>
    </>
  );
}
